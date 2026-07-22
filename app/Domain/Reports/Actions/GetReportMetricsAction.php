<?php

declare(strict_types=1);

namespace App\Domain\Reports\Actions;

use App\Domain\Calls\Models\CallLog;
use App\Domain\Reports\DTOs\ReportFilterDTO;
use Illuminate\Support\Facades\DB;

final class GetReportMetricsAction
{
    public function __construct(
        protected \App\Actions\Contacts\GetContactHashVariationsAction $getContactHashesAction
    ) {}

    public function execute(ReportFilterDTO $filters): array
    {
        $baseQuery = \App\Domain\Calls\Models\CallLog::query()
            ->leftJoin('call_classifications', 'call_logs.id', '=', 'call_classifications.call_log_id');

        if ($filters->startDate && $filters->endDate) {
            $baseQuery->whereBetween('call_logs.timestamp', [
                $filters->startDate->copy()->startOfDay(),
                $filters->endDate->copy()->endOfDay(),
            ]);
        }

        $this->applyFilters($baseQuery, $filters);

        $stats = $baseQuery->select([
            DB::raw('COUNT(*) as total_calls'),
            DB::raw("COUNT(CASE WHEN call_escalations.status IN ('pending', 'unattended') THEN 1 END) as missed_calls"),
            DB::raw('SUM(CASE WHEN '.CallLog::SQL_NO_ANSWER_CONDITION.' THEN 1 ELSE 0 END) as no_answer_calls'),
            DB::raw('SUM(CASE WHEN '.CallLog::SQL_CONNECTED_CONDITION.' THEN 1 ELSE 0 END) as connected_calls'),
            DB::raw('AVG(call_logs.duration) as avg_duration_seconds'),
            DB::raw("SUM(CASE WHEN call_escalations.status = 'pending' THEN 1 ELSE 0 END) as pending_escalations"),
            DB::raw("SUM(CASE WHEN call_escalations.status = 'unattended' THEN 1 ELSE 0 END) as unattended_escalations"),
            DB::raw("SUM(CASE WHEN call_escalations.status = 'resolved' THEN 1 ELSE 0 END) as resolved_escalations"),
            DB::raw('SUM(CASE WHEN '.CallLog::SQL_MISSED_CONDITION.' THEN 1 ELSE 0 END) as total_missed_calls'),
        ])
            ->leftJoin('call_escalations', 'call_logs.id', '=', 'call_escalations.call_log_id')
            ->toBase()->first();

        $total = $stats->total_calls ?? 0;

        // Scoped Agent Count
        $agentQuery = \App\Domain\Agents\Models\Agent::query();
        if ($filters->allowedAgentIds !== null) {
            $agentQuery->whereIn('id', $filters->allowedAgentIds);
        }
        if (! empty($filters->agentIds)) {
            $agentQuery->whereIn('id', $filters->agentIds);
        }
        if (! empty($filters->teamIds)) {
            $agentQuery->whereIn('id', function ($q) use ($filters) {
                $q->select('agent_id')
                    ->from('team_members')
                    ->whereIn('team_id', $filters->teamIds);
            });
        }
        $totalAgents = $agentQuery->count();

        return [
            [
                'label' => 'Total Agents',
                'value' => number_format($totalAgents),
                'icon' => 'users',
                'color' => 'text-blue-500',
            ],
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
                'sub_metrics' => [
                    ['label' => 'U', 'value' => (int) ($stats->unattended_escalations ?? 0), 'color' => 'bg-red-500'],
                    ['label' => 'P', 'value' => (int) ($stats->pending_escalations ?? 0), 'color' => 'bg-amber-500'],
                    ['label' => 'R', 'value' => (int) ($stats->resolved_escalations ?? 0), 'color' => 'bg-emerald-500'],
                    ['label' => 'T', 'value' => (int) ($stats->total_missed_calls ?? 0), 'color' => 'bg-zinc-500'],
                ],
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

        if ($filters->contactFilter !== null && $filters->contactFilter !== 'all') {
            $contactHashes = $this->getContactHashesAction->execute();

            if ($filters->contactFilter === 'internal') {
                $query->whereIn('call_logs.phone_number_hash', $contactHashes);
            } else {
                $query->whereNotIn('call_logs.phone_number_hash', $contactHashes);
            }
        }

        if ($filters->simSlot !== null) {
            $query->where('call_logs.sim_slot', $filters->simSlot);
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
