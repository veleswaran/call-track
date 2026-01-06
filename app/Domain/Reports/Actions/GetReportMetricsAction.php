<?php

declare(strict_types=1);

namespace App\Domain\Reports\Actions;

use App\Domain\Reports\DTOs\ReportFilterDTO;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

final class GetReportMetricsAction
{
    public function execute(ReportFilterDTO $filters): array
    {
        $baseQuery = DB::table('call_logs')
            ->leftJoin('call_classifications', 'call_logs.id', '=', 'call_classifications.call_log_id')
            ->whereBetween('call_logs.timestamp', [$filters->startDate, $filters->endDate]);

        $this->applyFilters($baseQuery, $filters);

        $stats = $baseQuery->select([
            DB::raw('COUNT(*) as total_calls'),
            DB::raw("SUM(CASE 
                WHEN call_logs.direction = 'MISSED' THEN 1 
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
        ])->first();

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

    private function applyFilters(Builder $query, ReportFilterDTO $filters): void
    {
        if (! empty($filters->agentIds)) {
            // Join devices to filter by agent/user
            $query->join('devices', 'call_logs.device_id', '=', 'devices.id')
                ->whereIn('devices.agent_id', $filters->agentIds);
        }

        if (! empty($filters->types)) {
            $query->whereIn('call_classifications.type', $filters->types);
        }

        // Status filter: Complex because status is derived from direction/duration
        if (! empty($filters->statuses)) {
            $query->where(function ($q) use ($filters) {
                foreach ($filters->statuses as $status) {
                    switch ($status) {
                        case 'MISSED':
                            $q->orWhere('call_logs.direction', 'MISSED');
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
