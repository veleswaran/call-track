<?php

declare(strict_types=1);

namespace App\Domain\Reports\Actions;

use App\Domain\Agents\Models\Agent;
use App\Domain\Calls\Models\CallLog;
use App\Domain\Devices\Models\Device;
use App\Domain\Reports\DTOs\ReportFilterDTO;
use App\Domain\Teams\Models\Team;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;

final class GetAgentInsightsAction
{
    public function execute(ReportFilterDTO $filters): array
    {
        // 1. Determine target agent
        $targetAgentId = null;
        if (! empty($filters->agentIds)) {
            $targetAgentId = (int) $filters->agentIds[0];
        }

        if ($targetAgentId === null) {
            // Find agent with most calls or first agent
            $topAgentQuery = CallLog::query()
                ->from('call_logs as cl')
                ->join('devices as d', 'd.id', '=', 'cl.device_id')
                ->join('agents as a', 'a.id', '=', 'd.agent_id');

            if ($filters->allowedAgentIds !== null) {
                if (empty($filters->allowedAgentIds)) {
                    return $this->emptyResponse();
                }
                $topAgentQuery->whereIn('a.id', $filters->allowedAgentIds);
            }

            if ($filters->startDate && $filters->endDate) {
                $topAgentQuery->whereBetween('cl.timestamp', [
                    $filters->startDate->copy()->startOfDay(),
                    $filters->endDate->copy()->endOfDay(),
                ]);
            }

            $topAgentId = $topAgentQuery->select('a.id', DB::raw('COUNT(cl.id) as calls_count'))
                ->groupBy('a.id')
                ->orderByDesc('calls_count')
                ->value('a.id');

            $targetAgentId = $topAgentId ? (int) $topAgentId : (int) Agent::query()->value('id');
        }

        if (! $targetAgentId) {
            return $this->emptyResponse();
        }

        /** @var Agent|null $agent */
        $agent = Agent::with(['devices', 'teams'])->find($targetAgentId);
        if (! $agent) {
            return $this->emptyResponse();
        }

        /** @var Device|null $activeDevice */
        $activeDevice = $agent->devices->first();
        $deviceHardwareId = $activeDevice?->device_uuid
            ? (str_starts_with($activeDevice->device_uuid, 'DEV-') ? $activeDevice->device_uuid : 'DEV-ANDR-'.substr(md5($activeDevice->device_uuid), 0, 4))
            : 'DEV-ANDR-'.str_pad((string) $agent->id, 4, '0', STR_PAD_LEFT);

        /** @var Team|null $firstTeam */
        $firstTeam = $agent->teams->first();
        $teamName = $firstTeam ? $firstTeam->name : 'General';
        $employeeCode = $agent->employee_code ?: 'AXNPL-'.str_pad((string) $agent->id, 3, '0', STR_PAD_LEFT);

        // 2. Query calls for this agent
        $callsQuery = CallLog::query()
            ->from('call_logs as cl')
            ->join('devices as d', 'd.id', '=', 'cl.device_id')
            ->where('d.agent_id', $agent->id)
            ->leftJoinSub(
                function ($query) {
                    $query->select(['call_log_id', 'status'])->from('call_escalations');
                },
                'ce',
                'ce.call_log_id',
                '=',
                'cl.id'
            );

        if ($filters->startDate && $filters->endDate) {
            $callsQuery->whereBetween('cl.timestamp', [
                $filters->startDate->copy()->startOfDay(),
                $filters->endDate->copy()->endOfDay(),
            ]);
        }

        if (! empty($filters->types)) {
            $callsQuery->leftJoin('call_classifications as cc', 'cl.id', '=', 'cc.call_log_id')
                ->whereIn('cc.type', array_map('strtoupper', $filters->types));
        }

        if ($filters->simSlot !== null) {
            $callsQuery->where('cl.sim_slot', $filters->simSlot);
        }

        $metrics = (clone $callsQuery)->toBase()->select([
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
            DB::raw("SUM(CASE WHEN ce.status IN ('pending', 'unattended') THEN 1 ELSE 0 END) as pending_missed"),
            DB::raw("SUM(CASE WHEN ce.status = 'resolved' THEN 1 ELSE 0 END) as resolved_missed"),
            DB::raw('SUM(cl.duration) as total_duration'),
            DB::raw('AVG(cl.duration) as avg_duration'),
            DB::raw('MIN(cl.timestamp) as first_call_time'),
            // Outreach splits
            DB::raw("SUM(CASE WHEN cl.direction = 'OUTGOING' THEN 1 ELSE 0 END) as outbound_calls"),
            DB::raw("SUM(CASE WHEN cl.direction = 'INCOMING' THEN 1 ELSE 0 END) as inbound_calls"),
            DB::raw('SUM(CASE WHEN cl.sim_slot = 0 OR cl.sim_slot = 1 THEN 1 ELSE 0 END) as sim_1_calls'),
            DB::raw('SUM(CASE WHEN cl.sim_slot = 2 THEN 1 ELSE 0 END) as sim_2_calls'),
        ])->first();

        $totalCalls = (int) ($metrics->total_calls ?? 0);
        $connectedCalls = (int) ($metrics->connected ?? 0);
        $missedCalls = (int) ($metrics->missed ?? 0);
        $totalDuration = (int) ($metrics->total_duration ?? 0);
        $avgDuration = (int) ($metrics->avg_duration ?? 0);

        $connectedRate = $totalCalls > 0 ? round(($connectedCalls / $totalCalls) * 100, 1) : 0.0;
        $handlingRate = $connectedRate;

        // Dynamic SLA rate for missed calls resolution from agent escalations
        $pendingMissed = (int) ($metrics->pending_missed ?? 0);
        $resolvedMissed = (int) ($metrics->resolved_missed ?? 0);
        $totalEscalations = $pendingMissed + $resolvedMissed;

        $slaResolutionRate = $totalEscalations > 0
            ? round(($resolvedMissed / $totalEscalations) * 100, 1)
            : ($missedCalls > 0 ? 0.0 : 100.0);

        // Splits
        $outbound = (int) ($metrics->outbound_calls ?? 0);
        $inbound = (int) ($metrics->inbound_calls ?? 0);
        $directionTotal = $outbound + $inbound;
        $outboundPct = $directionTotal > 0 ? (int) round(($outbound / $directionTotal) * 100) : 50;
        $inboundPct = 100 - $outboundPct;

        $sim1 = (int) ($metrics->sim_1_calls ?? 0);
        $sim2 = (int) ($metrics->sim_2_calls ?? 0);
        $simTotal = $sim1 + $sim2;
        $sim1Pct = $simTotal > 0 ? (int) round(($sim1 / $simTotal) * 100) : 80;
        $sim2Pct = 100 - $sim1Pct;

        // Classification split
        $businessCalls = (clone $callsQuery)
            ->join('call_classifications as cc_b', 'cl.id', '=', 'cc_b.call_log_id')
            ->where('cc_b.type', 'BUSINESS')
            ->count();
        $personalCalls = (clone $callsQuery)
            ->join('call_classifications as cc_p', 'cl.id', '=', 'cc_p.call_log_id')
            ->where('cc_p.type', 'PERSONAL')
            ->count();
        $classifiedTotal = $businessCalls + $personalCalls;
        $businessPct = $classifiedTotal > 0 ? (int) round(($businessCalls / $classifiedTotal) * 100) : 0;
        $personalPct = $classifiedTotal > 0 ? 100 - $businessPct : 0;

        // 3. Daily distribution
        $dailyRows = (clone $callsQuery)
            ->toBase()
            ->select([
                DB::raw('DATE(cl.timestamp) as call_date'),
                DB::raw('COUNT(cl.id) as daily_total'),
                DB::raw("SUM(CASE WHEN (
                    cl.duration > 0
                    AND ce.call_log_id IS NULL
                    AND cl.direction NOT IN ('MISSED', 'REJECTED', 'BLOCKED')
                ) THEN 1 ELSE 0 END) as daily_connected"),
                DB::raw("SUM(CASE WHEN (
                    ce.call_log_id IS NOT NULL
                    OR cl.direction IN ('MISSED', 'REJECTED', 'BLOCKED')
                    OR (cl.direction = 'INCOMING' AND cl.duration <= 0)
                ) THEN 1 ELSE 0 END) as daily_missed"),
                DB::raw('SUM(cl.duration) as daily_duration'),
            ])
            ->groupBy(DB::raw('DATE(cl.timestamp)'))
            ->orderBy('call_date', 'asc')
            ->get();

        $dailyStatsMap = [];
        foreach ($dailyRows as $row) {
            $dailyStatsMap[$row->call_date] = $row;
        }

        // Fill days in period or existing dates
        $startDate = $filters->startDate ? $filters->startDate->copy()->startOfDay() : Carbon::now()->startOfWeek();
        $endDate = $filters->endDate ? $filters->endDate->copy()->endOfDay() : Carbon::now()->endOfWeek();

        // Limit period loop to at most 14 days to prevent huge lists
        $diffDays = $startDate->diffInDays($endDate);
        if ($diffDays > 31) {
            $startDate = $endDate->copy()->subDays(30);
        }

        $dailyDistribution = [];
        $period = CarbonPeriod::create($startDate, $endDate);
        foreach ($period as $day) {
            $dateKey = $day->format('Y-m-d');
            $row = $dailyStatsMap[$dateKey] ?? null;

            $dTotal = $row ? (int) $row->daily_total : 0;
            $dConnected = $row ? (int) $row->daily_connected : 0;
            $dMissed = $row ? (int) $row->daily_missed : 0;
            $dDuration = $row ? (int) $row->daily_duration : 0;
            $dRate = $dTotal > 0 ? round(($dConnected / $dTotal) * 100, 1) : 0.0;

            if ($dTotal > 0 || $diffDays <= 7) {
                $dailyDistribution[] = [
                    'date' => $day->format('d M (D)'),
                    'raw_date' => $dateKey,
                    'total_calls' => $dTotal,
                    'connected' => $dConnected,
                    'missed' => $dMissed,
                    'talk_duration' => $this->formatDuration($dDuration),
                    'talk_duration_raw' => $dDuration,
                    'performance_percentage' => $dRate,
                ];
            }
        }

        return [
            'agent' => [
                'id' => $agent->id,
                'name' => $agent->name,
                'employee_code' => $employeeCode,
                'team' => $teamName,
                'device_hardware_id' => $deviceHardwareId,
                'first_call_time' => $metrics?->first_call_time ? Carbon::parse($metrics->first_call_time)->format('h:i A') : 'N/A',
                'handling_rate' => $handlingRate,
            ],
            'kpis' => [
                'calls_in_period' => $totalCalls,
                'connected_calls' => $connectedCalls,
                'connected_rate' => $connectedRate,
                'missed_calls' => $missedCalls,
                'pending_missed_calls' => $pendingMissed,
                'resolved_missed_calls' => $resolvedMissed,
                'sla_resolution_rate' => $slaResolutionRate,
                'total_talk_time' => $this->formatDuration($totalDuration),
                'total_talk_time_raw' => $totalDuration,
                'avg_talk_time' => $this->formatDuration($avgDuration),
            ],
            'daily_distribution' => $dailyDistribution,
            'outreach_characteristics' => [
                'direction' => [
                    'outbound_pct' => $outboundPct,
                    'inbound_pct' => $inboundPct,
                ],
                'sim_allocation' => [
                    'sim_1_pct' => $sim1Pct,
                    'sim_2_pct' => $sim2Pct,
                ],
                'classification' => [
                    'business_pct' => $businessPct,
                    'personal_pct' => $personalPct,
                ],
                'device_hardware_id' => $deviceHardwareId,
            ],
        ];
    }

    private function formatDuration(int $seconds): string
    {
        if ($seconds < 60) {
            return "{$seconds}s";
        }
        $h = floor($seconds / 3600);
        $m = floor(($seconds % 3600) / 60);

        if ($h > 0) {
            return "{$h}h {$m}m";
        }

        $s = $seconds % 60;

        return "{$m}m {$s}s";
    }

    private function emptyResponse(): array
    {
        return [
            'agent' => null,
            'kpis' => [
                'calls_in_period' => 0,
                'connected_calls' => 0,
                'connected_rate' => 0,
                'missed_calls' => 0,
                'sla_resolution_rate' => 0,
                'total_talk_time' => '0s',
                'total_talk_time_raw' => 0,
                'avg_talk_time' => '0s',
            ],
            'daily_distribution' => [],
            'outreach_characteristics' => [
                'direction' => ['outbound_pct' => 50, 'inbound_pct' => 50],
                'sim_allocation' => ['sim_1_pct' => 100, 'sim_2_pct' => 0],
                'classification' => ['business_pct' => 100, 'personal_pct' => 0],
                'device_hardware_id' => 'N/A',
            ],
        ];
    }
}
