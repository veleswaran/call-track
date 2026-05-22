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
        // Should join users/agents.
        // Assuming 'agents' are Users with specific role or just Users linked to Devices.
        // Devices have `agent_id` which might link to `users.id` (based on Laravel convention) or `agents` table.
        // Let's check `Device` model relationships later to be sure.
        // Assuming `agent_id` -> `users` (Admin is User, Agent is User).

        $query = \App\Domain\Agents\Models\Agent::query()
            ->join('devices', 'agents.id', '=', 'devices.agent_id')
            ->join('call_logs', 'devices.id', '=', 'call_logs.device_id')
            ->leftJoin('call_classifications', 'call_logs.id', '=', 'call_classifications.call_log_id');

        if ($filters->startDate && $filters->endDate) {
            $query->whereBetween('call_logs.timestamp', [
                $filters->startDate->copy()->startOfDay(),
                $filters->endDate->copy()->endOfDay(),
            ]);
        }

        // RBAC scope - security constraint
        if ($filters->allowedAgentIds !== null) {
            if (empty($filters->allowedAgentIds)) {
                // No access
                return new \Illuminate\Pagination\LengthAwarePaginator([], 0, $filters->perPage);
            }
            $query->whereIn('agents.id', $filters->allowedAgentIds);
        }

        // User-selected agent filter
        if (! empty($filters->agentIds)) {
            $query->whereIn('agents.id', $filters->agentIds);
        }

        // Apply team filter
        if (! empty($filters->teamIds)) {
            $query->whereIn('agents.id', function ($q) use ($filters) {
                $q->select('agent_id')
                    ->from('team_members')
                    ->whereIn('team_id', $filters->teamIds);
            });
        }

        // Filter by Classification (mapped from 'types' in DTO)
        if (! empty($filters->types)) {
            // Frontend sends BUSINESS/PERSONAL. Column in CallClassification is 'type'.
            $query->whereIn('call_classifications.type', array_map('strtoupper', $filters->types));
        }

        // Filter by Call Outcomes
        if (! empty($filters->outcomes)) {
            $query->where(function ($q) use ($filters) {
                foreach ($filters->outcomes as $outcome) {
                    $q->orWhere(function ($sub) use ($outcome) {
                        switch (strtoupper($outcome)) {
                            case 'CONNECTED':
                                $sub->where('call_logs.duration', '>', 0);
                                break;
                            case 'MISSED':
                                $sub->where(function ($inner) {
                                    $inner->whereIn('call_logs.direction', ['MISSED', 'REJECTED', 'BLOCKED'])
                                        ->orWhere(function ($inc) {
                                            $inc->where('call_logs.direction', 'INCOMING')->where('call_logs.duration', 0);
                                        });
                                });
                                break;
                            case 'NO_ANSWER':
                                $sub->where('call_logs.direction', 'OUTGOING')
                                    ->where('call_logs.duration', 0);
                                break;
                        }
                    });
                }
            });
        }

        if ($filters->contactFilter !== null && $filters->contactFilter !== 'all') {
            $contactHashes = $this->getContactHashesAction->execute();

            if ($filters->contactFilter === 'internal') {
                $query->whereIn('call_logs.phone_number_hash', $contactHashes);
            } else {
                $query->whereNotIn('call_logs.phone_number_hash', $contactHashes);
            }
        }

        // Group by Agent
        $stats = $query->select([
            'agents.id',
            'agents.name',
            'agents.employee_code',
            DB::raw('COUNT(call_logs.id) as total_calls'),
            DB::raw('SUM(CASE WHEN '.CallLog::SQL_CONNECTED_CONDITION.' THEN 1 ELSE 0 END) as connected'),
            DB::raw('SUM(CASE WHEN '.CallLog::SQL_MISSED_CONDITION.' THEN 1 ELSE 0 END) as missed'),
            DB::raw('AVG(call_logs.duration) as avg_duration'),
            DB::raw('SUM(call_logs.duration) as total_duration'),
            DB::raw('MIN(call_logs.timestamp) as first_call_time'),
        ])
            ->groupBy('agents.id', 'agents.name', 'agents.employee_code');

        $sortField = $filters->sortBy;
        $sortOrder = $filters->sortOrder ?? 'asc';

        if ($sortField) {
            $mappedSort = match ($sortField) {
                'agent' => 'agents.name',
                'total_calls' => 'total_calls',
                'connected' => 'connected',
                'missed' => 'missed',
                'avg_duration' => 'avg_duration',
                'total_duration' => 'total_duration',
                'first_call_time' => 'first_call_time',
                default => 'agents.name',
            };

            $query->orderBy($mappedSort, $sortOrder);
        } else {
            $query->orderBy('agents.name', 'asc');
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
                'employee_code' => 'EMP-'.str_pad((string) $stat->id, 3, '0', STR_PAD_LEFT), // Mock code
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
}
