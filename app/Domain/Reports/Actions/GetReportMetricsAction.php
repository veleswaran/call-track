<?php

declare(strict_types=1);

namespace App\Domain\Reports\Actions;

use App\Domain\Reports\DTOs\ReportFilterDTO;
use Illuminate\Support\Facades\DB;

final class GetReportMetricsAction
{
    public function execute(ReportFilterDTO $filters): array
    {
        $baseQuery = \App\Domain\Calls\Models\CallLog::query()
            ->leftJoin('call_classifications', 'call_logs.id', '=', 'call_classifications.call_log_id')
            ->whereBetween('call_logs.timestamp', [
                $filters->startDate->copy()->startOfDay(),
                $filters->endDate->copy()->endOfDay(),
            ]);

        $this->applyFilters($baseQuery, $filters);

        $stats = $baseQuery->select([
            DB::raw('COUNT(*) as total_calls'),
            DB::raw("SUM(CASE 
                WHEN call_logs.direction IN ('MISSED', 'REJECTED', 'BLOCKED') OR (call_logs.direction = 'INCOMING' AND call_logs.duration = 0) THEN 1 
                ELSE 0 
            END) as missed_calls"),
            DB::raw("SUM(CASE 
                WHEN call_logs.direction = 'OUTGOING' AND call_logs.duration = 0 THEN 1 
                ELSE 0 
            END) as no_answer_calls"),
            DB::raw('SUM(CASE 
                WHEN call_logs.duration > 0 THEN 1 
                ELSE 0 
            END) as connected_calls'),
            // Assuming average duration excludes missed/no-answer (duration=0) or includes all?
            // Usually "Average Handle Time" includes talk time.
            DB::raw('AVG(call_logs.duration) as avg_duration_seconds'),
        ])->toBase()->first();

        $total = $stats->total_calls ?? 0;

        return [
            [
                'label' => 'Total Calls',
                'value' => number_format($total),
                'icon' => 'phone',
            ],
            [
                'label' => 'Connected Calls',
                'value' => number_format((float) ($stats->connected_calls ?? 0)),
                'percentage' => $total > 0 ? round(($stats->connected_calls / $total) * 100, 1) : 0,
                'icon' => 'check-circle',
                'color' => 'text-green-500',
            ],
            [
                'label' => 'Missed Calls',
                'value' => number_format((float) ($stats->missed_calls ?? 0)),
                'percentage' => $total > 0 ? round(($stats->missed_calls / $total) * 100, 1) : 0,
                'icon' => 'x-circle',
                'color' => 'text-red-500',
            ],
            [
                'label' => 'No Answer',
                'value' => number_format((float) ($stats->no_answer_calls ?? 0)),
                'percentage' => $total > 0 ? round(($stats->no_answer_calls / $total) * 100, 1) : 0,
                'icon' => 'phone-off',
                'color' => 'text-yellow-500',
            ],
            [
                'label' => 'Avg Duration',
                'value' => $this->formatDuration((int) ($stats->avg_duration_seconds ?? 0)),
                'icon' => 'clock',
                'color' => 'text-blue-500',
            ],
        ];
    }

    private function applyFilters(\Illuminate\Database\Eloquent\Builder $query, ReportFilterDTO $filters): void
    {
        $devicesJoined = false;

        // Apply RBAC scope first - this is the security constraint
        if ($filters->allowedAgentIds !== null) {
            if (empty($filters->allowedAgentIds)) {
                $query->whereRaw('1 = 0');

                return;
            }
            $query->join('devices', 'call_logs.device_id', '=', 'devices.id')
                ->whereIn('devices.agent_id', $filters->allowedAgentIds);
            $devicesJoined = true;
        }

        // Apply user-selected agent filter (must be within allowed scope)
        if (! empty($filters->agentIds)) {
            if (! $devicesJoined) {
                $query->join('devices', 'call_logs.device_id', '=', 'devices.id');
                $devicesJoined = true;
            }
            $query->whereIn('devices.agent_id', $filters->agentIds);
        }

        // Apply team filter
        if (! empty($filters->teamIds)) {
            if (! $devicesJoined) {
                $query->join('devices', 'call_logs.device_id', '=', 'devices.id');
                $devicesJoined = true;
            }

            $query->whereIn('devices.agent_id', function ($q) use ($filters) {
                $q->select('agent_id')
                    ->from('team_members')
                    ->whereIn('team_id', $filters->teamIds);
            });
        }

        if (! empty($filters->types)) {
            $query->whereIn('call_classifications.type', $filters->types);
        }

        // Outcome filter: Complex because outcome is derived from direction/duration
        if (! empty($filters->outcomes)) {
            $query->where(function ($q) use ($filters) {
                foreach ($filters->outcomes as $outcome) {
                    switch (strtoupper($outcome)) {
                        case 'MISSED':
                            $q->orWhereIn('call_logs.direction', ['MISSED', 'REJECTED', 'BLOCKED'])
                                ->orWhere(function ($sq) {
                                    $sq->where('call_logs.direction', 'INCOMING')
                                        ->where('call_logs.duration', 0);
                                });
                            break;
                        case 'NO_ANSWER':
                            $q->orWhere(function ($sq) {
                                $sq->where('call_logs.direction', 'OUTGOING')
                                    ->where('call_logs.duration', 0);
                            });
                            break;
                        case 'CONNECTED':
                            $q->orWhere('call_logs.duration', '>', 0);
                            break;
                    }
                }
            });
        }
    }

    private function formatDuration(int $seconds): string
    {
        if ($seconds < 60) {
            return "{$seconds}s";
        }
        $minutes = floor($seconds / 60);
        $remainingSeconds = $seconds % 60;

        return "{$minutes}m {$remainingSeconds}s";
    }
}
