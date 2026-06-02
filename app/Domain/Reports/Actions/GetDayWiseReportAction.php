<?php

declare(strict_types=1);

namespace App\Domain\Reports\Actions;

use App\Actions\Contacts\GetContactHashVariationsAction;
use App\Domain\Calls\Models\CallLog;
use App\Domain\Reports\DTOs\ReportFilterDTO;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

final class GetDayWiseReportAction
{
    /**
     * Create a new GetDayWiseReportAction instance.
     */
    public function __construct(
        private readonly GetContactHashVariationsAction $contactHashesAction
    ) {}

    /**
     * Execute the day-wise report action.
     *
     * @throws \InvalidArgumentException
     */
    public function execute(ReportFilterDTO $filters): array
    {
        $startDate = $filters->startDate;
        $endDate = $filters->endDate;

        // Validate date range (max 32 days)
        if ($startDate && $endDate && $startDate->diffInDays($endDate) > 32) {
            throw new \InvalidArgumentException('Date range cannot exceed 32 days for day-wise reports');
        }

        // Get all dates in the range
        $period = CarbonPeriod::create($startDate, $endDate);
        $dates = collect($period)->map(fn (Carbon $date) => $date->format('Y-m-d'))->toArray();

        // Build the base query with filters
        $query = CallLog::query()
            ->from('call_logs as cl')
            ->join('devices as d', 'd.id', '=', 'cl.device_id')
            ->join('agents as a', 'a.id', '=', 'd.agent_id')
            ->selectRaw('
                a.id as agent_id,
                a.name as agent_name,
                a.employee_code,
                DATE(cl.timestamp) as call_date,
                COUNT(cl.id) as total_calls,
                SUM(CASE WHEN (
                    cl.duration > 0
                    AND NOT EXISTS (SELECT 1 FROM call_escalations WHERE call_escalations.call_log_id = cl.id)
                    AND cl.direction NOT IN (?, ?, ?)
                ) THEN 1 ELSE 0 END) as connected_calls,
                SUM(CASE WHEN (
                    EXISTS (SELECT 1 FROM call_escalations WHERE call_escalations.call_log_id = cl.id)
                    OR cl.direction IN (?, ?, ?)
                    OR (cl.direction = ? AND cl.duration <= 0)
                ) THEN 1 ELSE 0 END) as missed_calls,
                SUM(cl.duration) as total_duration,
                MIN(cl.timestamp) as first_call_time
            ', ['MISSED', 'REJECTED', 'BLOCKED', 'MISSED', 'REJECTED', 'BLOCKED', 'INCOMING'])
            ->whereBetween('cl.timestamp', [
                $startDate->copy()->startOfDay(),
                $endDate->copy()->endOfDay(),
            ])
            ->whereNotExists(function ($q) {
                $q->selectRaw(1)
                    ->from('call_classifications as cc_exclude')
                    ->whereColumn('cc_exclude.call_log_id', 'cl.id')
                    ->where('cc_exclude.type', 'PERSONAL');
            })
            ->groupBy('a.id', 'a.name', 'a.employee_code', DB::raw('DATE(cl.timestamp)'));

        // Apply filters
        $this->applyFilters($query, $filters);

        // Execute query
        $results = $query->get();

        // Group by agent and organize by date
        // @phpstan-ignore-next-line argument.unresolvableType - Collection contains dynamic properties from selectRaw
        $agentData = $results->groupBy('agent_id')->map(function (Collection $agentCalls, $agentId) use ($dates) {
            $firstAgent = $agentCalls->first();

            // Initialize daily stats for all dates
            $dailyStats = collect($dates)->mapWithKeys(function ($date) {
                return [
                    $date => [
                        'total_calls' => 0,
                        'connected' => 0,
                        'missed' => 0,
                        'total_duration' => 0,
                        'first_call_time' => null,
                    ],
                ];
            })->toArray();

            // Fill in actual data - properties added via selectRaw()
            foreach ($agentCalls as $dayData) {
                /** @phpstan-ignore-next-line property.notFound - call_date is dynamically added by selectRaw */
                $date = $dayData->call_date;
                $dailyStats[$date] = [
                    /** @phpstan-ignore-next-line property.notFound - total_calls is dynamically added by selectRaw */
                    'total_calls' => (int) $dayData->total_calls,
                    /** @phpstan-ignore-next-line property.notFound - connected_calls is dynamically added by selectRaw */
                    'connected' => (int) $dayData->connected_calls,
                    /** @phpstan-ignore-next-line property.notFound - missed_calls is dynamically added by selectRaw */
                    'missed' => (int) $dayData->missed_calls,
                    /** @phpstan-ignore-next-line property.notFound - total_duration is dynamically added by selectRaw */
                    'total_duration' => (int) $dayData->total_duration,
                    /** @phpstan-ignore-next-line property.notFound - first_call_time is dynamically added by selectRaw */
                    'first_call_time' => $dayData->first_call_time,
                ];
            }

            // Calculate period totals
            $periodTotal = [
                'total_calls' => $agentCalls->sum('total_calls'),
                'connected' => $agentCalls->sum('connected_calls'),
                'missed' => $agentCalls->sum('missed_calls'),
                'total_duration' => $agentCalls->sum('total_duration'),
            ];

            return [
                'agent_id' => (int) $agentId,
                /** @phpstan-ignore-next-line property.notFound - agent_name is dynamically added by selectRaw */
                'agent_name' => $firstAgent->agent_name,
                /** @phpstan-ignore-next-line property.notFound - employee_code is dynamically added by selectRaw */
                'employee_code' => $firstAgent->employee_code,
                'daily_stats' => $dailyStats,
                'period_total' => $periodTotal,
            ];
        })->values()->toArray();

        return [
            'agents' => $agentData,
            'dates' => $dates,
            'total_agents' => count($agentData),
            'total_days' => count($dates),
        ];
    }

    private function applyFilters($query, ReportFilterDTO $filters): void
    {
        // RBAC scope - security constraint
        if ($filters->allowedAgentIds !== null) {
            if (empty($filters->allowedAgentIds)) {
                // No access - return empty
                $query->whereRaw('1 = 0');

                return;
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
            $query->whereExists(function ($q) use ($filters) {
                $q->selectRaw(1)
                    ->from('call_classifications as cc')
                    ->whereColumn('cc.call_log_id', 'cl.id')
                    ->whereIn('cc.type', array_map('strtoupper', $filters->types));
            });
        }

        // Filter by Call Outcomes
        if (! empty($filters->outcomes)) {
            $query->where(function ($q) use ($filters) {
                foreach ($filters->outcomes as $outcome) {
                    $q->orWhere(function ($sub) use ($outcome) {
                        switch (strtoupper($outcome)) {
                            case 'CONNECTED':
                                $sub->where('cl.duration', '>', 0)
                                    ->whereNotExists(function ($innerQ) {
                                        $innerQ->selectRaw(1)
                                            ->from('call_escalations as ce_sub')
                                            ->whereColumn('ce_sub.call_log_id', 'cl.id');
                                    })
                                    ->whereNotIn('cl.direction', ['MISSED', 'REJECTED', 'BLOCKED']);
                                break;
                            case 'MISSED':
                                $sub->where(function ($inner) {
                                    $inner->whereExists(function ($innerQ) {
                                        $innerQ->selectRaw(1)
                                            ->from('call_escalations as ce_sub')
                                            ->whereColumn('ce_sub.call_log_id', 'cl.id');
                                    })
                                        ->orWhereIn('cl.direction', ['MISSED', 'REJECTED', 'BLOCKED'])
                                        ->orWhere(function ($inc) {
                                            $inc->where('cl.direction', 'INCOMING')->where('cl.duration', '<=', 0);
                                        });
                                });
                                break;
                            case 'NO_ANSWER':
                            case 'NO ANSWER':
                                $sub->where('cl.direction', 'OUTGOING')
                                    ->where('cl.duration', 0);
                                break;
                        }
                    });
                }
            });
        }

        // Contact filter (internal/external)
        if ($filters->contactFilter !== null && $filters->contactFilter !== 'all') {
            $contactHashes = $this->contactHashesAction->execute();

            if ($filters->contactFilter === 'internal') {
                $query->whereIn('cl.phone_number_hash', $contactHashes);
            } else {
                $query->whereNotIn('cl.phone_number_hash', $contactHashes);
            }
        }
    }
}
