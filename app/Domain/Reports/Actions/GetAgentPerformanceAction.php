<?php

declare(strict_types=1);

namespace App\Domain\Reports\Actions;

use App\Domain\Calls\Models\CallLog;
use App\Domain\Reports\DTOs\ReportFilterDTO;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

final class GetAgentPerformanceAction
{
    public function __construct(
        protected \App\Actions\Contacts\GetContactHashVariationsAction $getContactHashesAction
    ) {}

    public function execute(ReportFilterDTO $filters): LengthAwarePaginator
    {
        $query = CallLog::query()
            ->from('call_logs as cl')
            ->join('devices as d', 'd.id', '=', 'cl.device_id')
            ->join('agents as a', 'a.id', '=', 'd.agent_id')
            ->leftJoinSub(
                function ($query) {
                    $query->select('call_log_id')->distinct()->from('call_escalations');
                },
                'ce',
                'ce.call_log_id',
                '=',
                'cl.id'
            )
            ->whereNotExists(function ($q) {
                $q->selectRaw(1)
                    ->from('call_classifications as cc_exclude')
                    ->whereColumn('cc_exclude.call_log_id', 'cl.id')
                    ->where('cc_exclude.type', 'PERSONAL');
            });

        if ($filters->startDate && $filters->endDate) {
            $query->whereBetween('cl.timestamp', [
                $filters->startDate->copy()->startOfDay(),
                $filters->endDate->copy()->endOfDay(),
            ]);
        }

        // RBAC scope - security constraint
        if ($filters->allowedAgentIds !== null) {
            if (empty($filters->allowedAgentIds)) {
                // No access
                return new \Illuminate\Pagination\LengthAwarePaginator([], 0, $filters->perPage, $filters->page);
            }
            $query->whereIn('a.id', $filters->allowedAgentIds);
        }

        // User-selected agent filter
        if (! empty($filters->agentIds)) {
            $query->whereIn('a.id', $filters->agentIds);
        }

        // Apply team filter
        if (! empty($filters->teamIds)) {
            $query->whereIn('a.id', function ($q) use ($filters) {
                $q->select('agent_id')
                    ->from('team_members')
                    ->whereIn('team_id', $filters->teamIds);
            });
        }

        // Filter by Classification (mapped from 'types' in DTO)
        if (! empty($filters->types)) {
            // Frontend sends BUSINESS/PERSONAL. Column in CallClassification is 'type'.
            $query->leftJoin('call_classifications as cc', 'cl.id', '=', 'cc.call_log_id')
                ->whereIn('cc.type', array_map('strtoupper', $filters->types));
        }

        // Filter by Call Outcomes
        if (! empty($filters->outcomes)) {
            $query->where(function ($q) use ($filters) {
                foreach ($filters->outcomes as $outcome) {
                    $q->orWhere(function ($sub) use ($outcome) {
                        switch (strtoupper($outcome)) {
                            case 'CONNECTED':
                                $sub->where('cl.duration', '>', 0)
                                    ->whereNull('ce.call_log_id')
                                    ->whereNotIn('cl.direction', ['MISSED', 'REJECTED', 'BLOCKED']);
                                break;
                            case 'MISSED':
                                $sub->where(function ($inner) {
                                    $inner->whereNotNull('ce.call_log_id')
                                        ->orWhereIn('cl.direction', ['MISSED', 'REJECTED', 'BLOCKED'])
                                        ->orWhere(function ($inc) {
                                            $inc->where('cl.direction', 'INCOMING')->where('cl.duration', '<=', 0);
                                        });
                                });
                                break;
                            case 'NO_ANSWER':
                                $sub->where('cl.direction', 'OUTGOING')
                                    ->where('cl.duration', 0);
                                break;
                        }
                    });
                }
            });
        }

        if ($filters->contactFilter !== null && $filters->contactFilter !== 'all') {
            $contactHashes = $this->getContactHashesAction->execute();

            if ($filters->contactFilter === 'internal') {
                $query->whereIn('cl.phone_number_hash', $contactHashes);
            } else {
                $query->whereNotIn('cl.phone_number_hash', $contactHashes);
            }
        }

        // Group by Agent
        $stats = $query->select([
            'a.id',
            'a.name',
            'a.employee_code',
            DB::raw('COUNT(cl.id) as total_calls'),
            DB::raw("SUM(CASE WHEN (
                cl.duration > 0
                AND ce.call_log_id IS NULL
                AND cl.direction NOT IN ('MISSED', 'REJECTED', 'BLOCKED')
            ) THEN 1 ELSE 0 END) as connected"),
            DB::raw("SUM(CASE WHEN (
                ce.call_log_id IS NOT NULL
                OR cl.direction IN ('MISSED', 'REJECTED', 'BLOCKED')
                OR (cl.direction = 'INCOMING' AND cl.duration <= 0)
            ) THEN 1 ELSE 0 END) as missed"),
            DB::raw('AVG(cl.duration) as avg_duration'),
            DB::raw('SUM(cl.duration) as total_duration'),
            DB::raw('MIN(cl.timestamp) as first_call_time'),
        ])
            ->groupBy('a.id', 'a.name', 'a.employee_code');

        $sortField = $filters->sortBy;
        $sortOrder = $filters->sortOrder ?? 'asc';

        if ($sortField) {
            $mappedSort = match ($sortField) {
                'agent' => 'a.name',
                'total_calls' => 'total_calls',
                'connected' => 'connected',
                'missed' => 'missed',
                'avg_duration' => 'avg_duration',
                'total_duration' => 'total_duration',
                'first_call_time' => 'first_call_time',
                default => 'a.name',
            };

            $query->orderBy($mappedSort, $sortOrder);
        } else {
            $query->orderBy('a.name', 'asc');
        }

        $stats = $query->toBase()
            ->paginate(perPage: $filters->perPage, page: $filters->page);

        $stats->getCollection()->transform(function ($stat) {
            $total = (int) $stat->total_calls;
            $connected = (int) $stat->connected;
            $handlingRate = $total > 0 ? round(($connected / $total) * 100, 1) : 0;

            $performance = 'Average';
            if ($handlingRate >= 80) {
                $performance = 'Excellent';
            } elseif ($handlingRate < 40) {
                $performance = 'Poor';
            }

            return [
                'id' => $stat->id,
                'agent' => $stat->name,
                'employee_code' => $this->resolveEmployeeCode($stat->employee_code, (int) $stat->id),
                'first_call_time' => $stat->first_call_time ? \Carbon\Carbon::parse($stat->first_call_time)->format('h:i A') : 'N/A',
                'total_calls' => $total,
                'connected' => $connected,
                'missed' => (int) $stat->missed,
                'avg_duration' => $this->formatDuration((int) $stat->avg_duration),
                'total_duration' => $this->formatDuration((int) $stat->total_duration),
                'handling_rate' => $handlingRate,
                'performance' => $performance,
            ];
        });

        return $stats;
    }

    private function formatDuration(int $seconds): string
    {
        if ($seconds < 60) {
            return "{$seconds}s";
        }
        $h = floor($seconds / 3600);
        $m = floor(($seconds % 3600) / 60);
        $s = $seconds % 60;

        if ($h > 0) {
            return "{$h}h {$m}m"; // Simplified for table width
        }

        return "{$m}m {$s}s";
    }

    private function resolveEmployeeCode(?string $employeeCode, int $agentId): string
    {
        if ($employeeCode !== null && $employeeCode !== '') {
            return $employeeCode;
        }

        return 'EMP-'.str_pad((string) $agentId, 3, '0', STR_PAD_LEFT);
    }
}
