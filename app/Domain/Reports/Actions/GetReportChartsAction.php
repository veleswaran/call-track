<?php

declare(strict_types=1);

namespace App\Domain\Reports\Actions;

use App\Domain\Reports\DTOs\ReportFilterDTO;
use Illuminate\Support\Facades\DB;

final class GetReportChartsAction
{
    public function execute(ReportFilterDTO $filters): array
    {
        return [
            'calls_per_day' => $this->getCallsPerDay($filters),
            'status_distribution' => $this->getStatusDistribution($filters),
            'peak_call_hours' => $this->getPeakCallHours($filters),
            'caller_types' => $this->getCallerTypeBreakdown($filters),
            'call_direction_distribution' => $this->getCallDirectionDistribution($filters),
            'agent_distribution' => $this->getAgentDistribution($filters),
            'team_distribution' => $this->getTeamDistribution($filters),
        ];
    }

    private function getBaseQuery(ReportFilterDTO $filters): \Illuminate\Database\Eloquent\Builder
    {
        $query = \App\Domain\Calls\Models\CallLog::query()
            ->leftJoin('call_classifications', 'call_logs.id', '=', 'call_classifications.call_log_id')
            ->whereBetween('call_logs.timestamp', [$filters->startDate, $filters->endDate]);

        // Apply RBAC scope first
        $devicesJoined = false;
        if ($filters->allowedAgentIds !== null) {
            if (empty($filters->allowedAgentIds)) {
                $query->whereRaw('1 = 0');

                return $query;
            }
            $query->join('devices', 'call_logs.device_id', '=', 'devices.id')
                ->whereIn('devices.agent_id', $filters->allowedAgentIds);
            $devicesJoined = true;
        }

        if (! empty($filters->agentIds)) {
            if (! $devicesJoined) {
                $query->join('devices', 'call_logs.device_id', '=', 'devices.id');
                $devicesJoined = true;
            }
            $query->whereIn('devices.agent_id', $filters->agentIds);
        }

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
        // Helper to apply status filters if needed, but charts usually show ALL statuses unless specifically filtered.
        // For consistency, we should apply them.
        // Filter by Call Outcomes
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

        return $query;
    }

    private function getCallsPerDay(ReportFilterDTO $filters): array
    {
        $data = $this->getBaseQuery($filters)
            ->selectRaw("
                DATE(call_logs.timestamp) as date,
                SUM(CASE WHEN call_logs.direction IN ('MISSED', 'REJECTED', 'BLOCKED') OR (call_logs.direction = 'INCOMING' AND call_logs.duration = 0) THEN 1 ELSE 0 END) as missed,
                SUM(CASE WHEN call_logs.direction = 'OUTGOING' AND call_logs.duration = 0 THEN 1 ELSE 0 END) as no_answer,
                SUM(CASE WHEN call_logs.duration > 0 THEN 1 ELSE 0 END) as connected
            ")
            ->groupBy('date')
            ->orderBy('date')
            ->toBase()
            ->get();

        // Fill missing dates
        $period = new \DatePeriod(
            $filters->startDate->copy()->startOfDay(),
            new \DateInterval('P1D'),
            $filters->endDate->copy()->endOfDay()
        );

        $result = [];
        $keyedData = $data->keyBy('date');

        foreach ($period as $date) {
            $dateStr = $date->format('Y-m-d');
            $record = $keyedData[$dateStr] ?? null;

            $result[] = [
                'date' => $date->format('d M'), // Display format e.g. 05 Jan
                'connected' => $record ? (int) $record->connected : 0,
                'missed' => $record ? (int) $record->missed : 0,
                'no_answer' => $record ? (int) $record->no_answer : 0,
            ];
        }

        return $result;
    }

    private function getStatusDistribution(ReportFilterDTO $filters): array
    {
        // Status derived: Missed, Connected, No Answer
        $stats = $this->getBaseQuery($filters)
            ->selectRaw("
                SUM(CASE WHEN call_logs.direction = 'MISSED' THEN 1 ELSE 0 END) as missed,
                SUM(CASE WHEN call_logs.direction = 'OUTGOING' AND call_logs.duration = 0 THEN 1 ELSE 0 END) as no_answer,
                SUM(CASE WHEN call_logs.duration > 0 THEN 1 ELSE 0 END) as connected
            ")
            ->toBase()
            ->first();

        return [
            ['name' => 'Connected', 'value' => (int) ($stats->connected ?? 0), 'fill' => '#22c55e'], // Green
            ['name' => 'Missed', 'value' => (int) ($stats->missed ?? 0), 'fill' => '#ef4444'],   // Red
            ['name' => 'No Answer', 'value' => (int) ($stats->no_answer ?? 0), 'fill' => '#eab308'], // Yellow
        ];
    }

    private function getPeakCallHours(ReportFilterDTO $filters): array
    {
        $driver = DB::connection()->getDriverName();
        $hourExpression = $driver === 'sqlite'
            ? "CAST(strftime('%H', call_logs.timestamp) AS INTEGER)"
            : 'EXTRACT(HOUR FROM call_logs.timestamp)';

        $data = $this->getBaseQuery($filters)
            ->selectRaw("$hourExpression as hour, COUNT(*) as count")
            ->groupBy('hour')
            ->orderBy('hour')
            ->toBase()
            ->get();

        $result = [];
        $keyedData = $data->keyBy('hour');

        // 0 to 23 hours
        for ($i = 0; $i < 24; $i++) {
            $result[] = [
                'hour' => $i,
                'label' => ($i == 0 ? '12 AM' : ($i < 12 ? "$i AM" : ($i == 12 ? '12 PM' : ($i - 12).' PM'))),
                'value' => isset($keyedData[$i]) ? (int) $keyedData[$i]->count : 0,
            ];
        }

        return $result;
    }

    private function getCallerTypeBreakdown(ReportFilterDTO $filters): array
    {
        // New vs Returning callers based on phone_number in the period?
        // The current logic implements a "New to the Company" (Acquisition) definition:
        // First-Time Caller: Someone whose very first interaction with the system occurred within the selected date range.
        // Returning Caller: Someone who called during the selected range but had already called at least once before the selected range started.

        // Let's approximate: count distinct numbers that have calls BEFORE start date.
        // 1. Get unique numbers in current range.
        // 2. Count how many of them appear in logs BEFORE start date.

        // Get unique numbers in range
        $numbersInRange = $this->getBaseQuery($filters)->distinct()->pluck('phone_number_hash');

        if ($numbersInRange->isEmpty()) {
            return [
                ['name' => 'First-Time Callers', 'value' => 0, 'fill' => '#3b82f6'],
                ['name' => 'Returning Callers', 'value' => 0, 'fill' => '#a855f7'],
            ];
        }

        $returningCount = DB::table('call_logs')
            ->whereIn('phone_number_hash', $numbersInRange)
            ->where('timestamp', '<', $filters->startDate)
            ->distinct('phone_number_hash')
            ->count('phone_number_hash');

        $totalUnique = $numbersInRange->count();
        $firstTime = $totalUnique - $returningCount;

        return [
            ['name' => 'First-Time Callers', 'value' => $firstTime, 'fill' => '#3b82f6'], // Blue
            ['name' => 'Returning Callers', 'value' => $returningCount, 'fill' => '#a855f7'], // Purple
        ];
    }

    private function getCallDirectionDistribution(ReportFilterDTO $filters): array
    {
        $stats = $this->getBaseQuery($filters)
            ->selectRaw("
                SUM(CASE WHEN call_logs.direction IN ('INCOMING', 'MISSED') THEN 1 ELSE 0 END) as incoming,
                SUM(CASE WHEN call_logs.direction = 'OUTGOING' THEN 1 ELSE 0 END) as outgoing
            ")
            ->toBase()
            ->first();

        return [
            ['name' => 'Incoming', 'value' => (int) ($stats->incoming ?? 0), 'fill' => '#3b82f6'], // Blue
            ['name' => 'Outgoing', 'value' => (int) ($stats->outgoing ?? 0), 'fill' => '#22c55e'], // Green
        ];
    }

    private function getAgentDistribution(ReportFilterDTO $filters): array
    {
        $query = \App\Domain\Agents\Models\Agent::query()
            ->where('created_at', '<=', $filters->endDate);

        // Only show agents who have call logs in this period
        $query->whereHas('devices.callLogs', function ($q) use ($filters) {
            $q->whereBetween('timestamp', [$filters->startDate, $filters->endDate]);
        });

        if ($filters->allowedAgentIds !== null) {
            if (empty($filters->allowedAgentIds)) {
                return [
                    ['name' => 'Active', 'value' => 0, 'fill' => '#22c55e'],
                    ['name' => 'Inactive', 'value' => 0, 'fill' => '#ef4444'],
                ];
            }
            $query->whereIn('id', $filters->allowedAgentIds);
        }

        if (! empty($filters->agentIds)) {
            $query->whereIn('id', $filters->agentIds);
        }

        if (! empty($filters->teamIds)) {
            $query->whereIn('id', function ($q) use ($filters) {
                $q->select('agent_id')
                    ->from('team_members')
                    ->whereIn('team_id', $filters->teamIds);
            });
        }

        $stats = $query->selectRaw("
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive
            ")
            ->toBase()
            ->first();

        return [
            ['name' => 'Active', 'value' => (int) ($stats->active ?? 0), 'fill' => '#22c55e'], // Green
            ['name' => 'Inactive', 'value' => (int) ($stats->inactive ?? 0), 'fill' => '#ef4444'], // Red
        ];
    }

    private function getTeamDistribution(ReportFilterDTO $filters): array
    {
        // We want to count agents per team that match the overall scope/filters
        $query = \App\Domain\Teams\Models\Team::query();

        $query->withCount([
            'members' => function ($q) use ($filters) {
                $q->where('agents.created_at', '<=', $filters->endDate);

                // Only count agents who have call logs in this period
                $q->whereHas('devices.callLogs', function ($sub) use ($filters) {
                    $sub->whereBetween('timestamp', [$filters->startDate, $filters->endDate]);
                });

                if ($filters->allowedAgentIds !== null) {
                    $q->whereIn('agents.id', $filters->allowedAgentIds);
                }
                if (! empty($filters->agentIds)) {
                    $q->whereIn('agents.id', $filters->agentIds);
                }
            },
        ]);

        // Filter the teams shown based on team selection if provided
        if (! empty($filters->teamIds)) {
            $query->whereIn('id', $filters->teamIds);
        }

        // Only show teams that have agents with call logs in this period
        $query->whereHas('members', function ($q) use ($filters) {
            $q->where('agents.created_at', '<=', $filters->endDate);

            $q->whereHas('devices.callLogs', function ($sub) use ($filters) {
                $sub->whereBetween('timestamp', [$filters->startDate, $filters->endDate]);
            });

            if ($filters->allowedAgentIds !== null) {
                $q->whereIn('agents.id', $filters->allowedAgentIds);
            }
            if (! empty($filters->agentIds)) {
                $q->whereIn('agents.id', $filters->agentIds);
            }
        });

        $teams = $query->get();

        return $teams->map(fn ($team) => [
            'name' => $team->name,
            'value' => (int) $team->members_count,
        ])->filter(fn ($item) => $item['value'] > 0)->values()->toArray();
    }
}
