<?php

declare(strict_types=1);

namespace App\Domain\Dashboard\Actions;

use App\Domain\Agents\Models\Agent;
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
     * Execute the action to get aggregated dashboard metrics for current week
     * with comparison to previous week
     */
    public function execute(): DashboardMetricsDTO
    {
        // Use Asia/Kolkata timezone to match database timestamp storage
        $tz = 'Asia/Kolkata';
        $currentWeekStart = Carbon::now($tz)->startOfWeek();
        $currentWeekEnd = Carbon::now($tz)->endOfWeek();
        $previousWeekStart = Carbon::now($tz)->subWeek()->startOfWeek();
        $previousWeekEnd = Carbon::now($tz)->subWeek()->endOfWeek();

        // Get current week metrics
        $currentStats = $this->getCallStats($currentWeekStart, $currentWeekEnd);
        $currentActiveDevices = $this->getActiveDevices($currentWeekStart, $currentWeekEnd);

        // Get previous week metrics for comparison
        $previousStats = $this->getCallStats($previousWeekStart, $previousWeekEnd);
        $previousActiveDevices = $this->getActiveDevices($previousWeekStart, $previousWeekEnd);

        // Device and agent counts (total, not time-filtered)
        $totalDevices = Device::count();
        $totalAgents = Agent::count();

        // Calculate comparison percentages
        $totalCallsChange = $this->calculatePercentChange(
            (int) ($previousStats->total_calls ?? 0),
            (int) ($currentStats->total_calls ?? 0)
        );
        $activeDevicesChange = $this->calculatePercentChange(
            $previousActiveDevices,
            $currentActiveDevices
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
            'active_devices' => $currentActiveDevices,
            'total_agents' => $totalAgents,
            'total_duration_seconds' => $currentStats->total_duration_seconds ?? 0,
            'average_call_duration_seconds' => $currentStats->average_call_duration_seconds ?? 0,
            'total_calls_change_percent' => $totalCallsChange,
            'active_devices_change_percent' => $activeDevicesChange,
            'average_call_duration_change_percent' => $avgDurationChange,
            'total_duration_change_percent' => $totalDurationChange,
        ]);
    }

    /**
     * Get call statistics for a given date range
     */
    private function getCallStats(Carbon $start, Carbon $end): object
    {
        return DB::table('call_logs')
            ->leftJoin('call_classifications', 'call_logs.id', '=', 'call_classifications.call_log_id')
            ->whereBetween('call_logs.timestamp', [$start, $end])
            ->select([
                DB::raw('COUNT(call_logs.id) as total_calls'),
                DB::raw("SUM(CASE WHEN call_classifications.type = 'BUSINESS' THEN 1 ELSE 0 END) as business_calls"),
                DB::raw("SUM(CASE WHEN call_classifications.type = 'PERSONAL' THEN 1 ELSE 0 END) as personal_calls"),
                DB::raw("SUM(CASE WHEN call_classifications.type = 'IGNORED' THEN 1 ELSE 0 END) as ignored_calls"),
                DB::raw('SUM(CASE WHEN call_classifications.type IS NULL THEN 1 ELSE 0 END) as unclassified_calls'),
                DB::raw('COALESCE(SUM(call_logs.duration), 0) as total_duration_seconds'),
                DB::raw('COALESCE(AVG(call_logs.duration), 0) as average_call_duration_seconds'),
            ])
            ->first() ?? (object) [];
    }

    /**
     * Get active device count for a given date range
     */
    private function getActiveDevices(Carbon $start, Carbon $end): int
    {
        return DB::table('call_logs')
            ->whereBetween('timestamp', [$start, $end])
            ->distinct('device_id')
            ->count('device_id');
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
