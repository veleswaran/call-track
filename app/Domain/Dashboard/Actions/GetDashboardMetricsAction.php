<?php

declare(strict_types=1);

namespace App\Domain\Dashboard\Actions;

use App\Domain\Agents\Models\Agent;
use App\Domain\Dashboard\DTOs\DashboardFilterDTO;
use App\Domain\Dashboard\DTOs\DashboardMetricsDTO;
use App\Domain\Devices\Models\Device;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Action to compute dashboard metrics from database
 */
final class GetDashboardMetricsAction
{
    /**
     * Execute the action to get aggregated dashboard metrics for a period
     * with comparison to the previous period of the same length
     */
    public function execute(DashboardFilterDTO $filter): DashboardMetricsDTO
    {
        // Use Asia/Kolkata timezone to match database timestamp storage
        $tz = 'Asia/Kolkata';

        if ($filter->startDate && $filter->endDate) {
            $currentStart = $filter->startDate->copy()->startOfDay();
            $currentEnd = $filter->endDate->copy()->endOfDay();

            // Comparison period is the preceding period of the same length
            $diffInDays = $currentStart->diffInDays($currentEnd) + 1;
            $previousStart = $currentStart->copy()->subDays($diffInDays);
            $previousEnd = $currentEnd->copy()->subDays($diffInDays);
        } else {
            $currentStart = Carbon::now($tz)->startOfWeek();
            $currentEnd = Carbon::now($tz)->endOfWeek();
            $previousStart = Carbon::now($tz)->subWeek()->startOfWeek();
            $previousEnd = Carbon::now($tz)->subWeek()->endOfWeek();
        }

        // Get current period metrics
        $currentStats = $this->getCallStats($currentStart, $currentEnd, $filter->allowedAgentIds);
        $currentMissedCalls = $currentStats->missed_calls ?? 0;

        // Get previous period metrics for comparison
        $previousStats = $this->getCallStats($previousStart, $previousEnd, $filter->allowedAgentIds);
        $previousMissedCalls = $previousStats->missed_calls ?? 0;

        // Device and agent counts (scoped)
        if ($filter->allowedAgentIds !== null) {
            $totalDevices = Device::whereIn('agent_id', $filter->allowedAgentIds)->count();
            $totalAgents = count($filter->allowedAgentIds);
        } else {
            $totalDevices = Device::count();
            $totalAgents = Agent::count();
        }

        // Active devices: Devices that have synced calls in the current period
        $activeDevicesQuery = DB::table('call_logs')
            ->join('devices', 'call_logs.device_id', '=', 'devices.id')
            ->whereBetween('call_logs.timestamp', [$currentStart, $currentEnd]);

        if ($filter->allowedAgentIds !== null) {
            $activeDevicesQuery->whereIn('devices.agent_id', $filter->allowedAgentIds);
        }

        $activeDevices = $activeDevicesQuery
            ->distinct('call_logs.device_id')
            ->count('call_logs.device_id');

        // Calculate comparison percentages
        $totalCallsChange = $this->calculatePercentChange(
            (int) ($previousStats->total_calls ?? 0),
            (int) ($currentStats->total_calls ?? 0)
        );
        $missedCallsChange = $this->calculatePercentChange(
            (int) $previousMissedCalls,
            (int) $currentMissedCalls
        );
        $avgDurationChange = $this->calculatePercentChange(
            (float) ($previousStats->average_call_duration_seconds ?? 0),
            (float) ($currentStats->average_call_duration_seconds ?? 0)
        );
        $totalDurationChange = $this->calculatePercentChange(
            (int) ($previousStats->total_duration_seconds ?? 0),
            (int) ($currentStats->total_duration_seconds ?? 0)
        );

        return DashboardMetricsDTO::fromArray([
            'total_calls' => $currentStats->total_calls ?? 0,
            'business_calls' => $currentStats->business_calls ?? 0,
            'personal_calls' => $currentStats->personal_calls ?? 0,
            'ignored_calls' => $currentStats->ignored_calls ?? 0,
            'unclassified_calls' => $currentStats->unclassified_calls ?? 0,
            'total_devices' => $totalDevices,
            'active_devices' => $activeDevices,
            'missed_calls' => $currentMissedCalls,
            'total_agents' => $totalAgents,
            'total_duration_seconds' => $currentStats->total_duration_seconds ?? 0,
            'average_call_duration_seconds' => $currentStats->average_call_duration_seconds ?? 0,
            'pending_escalations' => (int) ($currentStats->pending_escalations ?? 0),
            'unattended_escalations' => (int) ($currentStats->unattended_escalations ?? 0),
            'resolved_escalations' => (int) ($currentStats->resolved_escalations ?? 0),
            'total_calls_change_percent' => $totalCallsChange,
            'missed_calls_change_percent' => $missedCallsChange,
            'average_call_duration_change_percent' => $avgDurationChange,
            'total_duration_change_percent' => $totalDurationChange,
        ]);
    }

    /**
     * Get call statistics for a given date range
     */
    private function getCallStats(Carbon $start, Carbon $end, ?array $allowedAgentIds): object
    {
        $query = DB::table('call_logs')
            ->join('devices', 'call_logs.device_id', '=', 'devices.id')
            ->leftJoin('call_classifications', 'call_logs.id', '=', 'call_classifications.call_log_id')
            ->leftJoin('call_escalations', 'call_logs.id', '=', 'call_escalations.call_log_id')
            ->whereBetween('call_logs.timestamp', [$start, $end]);

        if ($allowedAgentIds !== null) {
            $query->whereIn('devices.agent_id', $allowedAgentIds);
        }

        return $query->select([
            DB::raw('COUNT(call_logs.id) as total_calls'),
            DB::raw("SUM(CASE WHEN call_classifications.type = 'BUSINESS' OR call_classifications.type IS NULL THEN 1 ELSE 0 END) as business_calls"),
            DB::raw("SUM(CASE WHEN call_classifications.type = 'PERSONAL' THEN 1 ELSE 0 END) as personal_calls"),
            DB::raw("SUM(CASE WHEN call_classifications.type = 'IGNORED' THEN 1 ELSE 0 END) as ignored_calls"),
            DB::raw("SUM(CASE WHEN call_escalations.id IS NOT NULL THEN 1 ELSE 0 END) as missed_calls"),
            DB::raw('0 as unclassified_calls'),
            DB::raw('COALESCE(SUM(call_logs.duration), 0) as total_duration_seconds'),
            DB::raw('COALESCE(AVG(call_logs.duration), 0) as average_call_duration_seconds'),
            DB::raw("SUM(CASE WHEN call_escalations.status = 'pending' THEN 1 ELSE 0 END) as pending_escalations"),
            DB::raw("SUM(CASE WHEN call_escalations.status = 'unattended' THEN 1 ELSE 0 END) as unattended_escalations"),
            DB::raw("SUM(CASE WHEN call_escalations.status = 'resolved' THEN 1 ELSE 0 END) as resolved_escalations"),
        ])
            ->first() ?? (object) [];
    }

    /**
     * Calculate percentage change between two values
     * Returns null if previous value is 0 (to avoid division by zero)
     */
    private function calculatePercentChange(int|float $previous, int|float $current): ?float
    {
        if ($previous == 0) {
            // If previous is 0 but current has value, it's infinite growth
            // Return null to indicate "N/A" or we could return 100 for "new"
            return $current > 0 ? 100.0 : null;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }
}
