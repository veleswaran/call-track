<?php

declare(strict_types=1);

namespace App\Domain\Dashboard\Actions;

use App\Domain\Agents\Models\Agent;
use App\Domain\Dashboard\DTOs\DashboardMetricsDTO;
use App\Domain\Devices\Models\Device;
use Illuminate\Support\Facades\DB;

/**
 * Action to compute dashboard metrics from database
 */
final class GetDashboardMetricsAction
{
    /**
     * Execute the action to get aggregated dashboard metrics
     */
    public function execute(): DashboardMetricsDTO
    {
        // Call statistics with classification breakdown (JOIN with call_classifications)
        $callStats = DB::table('call_logs')
            ->leftJoin('call_classifications', 'call_logs.id', '=', 'call_classifications.call_log_id')
            ->select([
                DB::raw('COUNT(call_logs.id) as total_calls'),
                DB::raw("SUM(CASE WHEN call_classifications.type = 'BUSINESS' THEN 1 ELSE 0 END) as business_calls"),
                DB::raw("SUM(CASE WHEN call_classifications.type = 'PERSONAL' THEN 1 ELSE 0 END) as personal_calls"),
                DB::raw("SUM(CASE WHEN call_classifications.type = 'IGNORED' THEN 1 ELSE 0 END) as ignored_calls"),
                DB::raw('SUM(CASE WHEN call_classifications.type IS NULL THEN 1 ELSE 0 END) as unclassified_calls'),
                DB::raw('COALESCE(SUM(call_logs.duration), 0) as total_duration_seconds'),
                DB::raw('COALESCE(AVG(call_logs.duration), 0) as average_call_duration_seconds'),
            ])
            ->first();

        // Device and agent counts
        $totalDevices = Device::count();
        $totalAgents = Agent::count();

        // Active devices: count devices that have synced in the last 24 hours
        $activeDevices = DB::table('call_logs')
            ->where('created_at', '>=', now()->subDay())
            ->distinct('device_id')
            ->count('device_id');

        return DashboardMetricsDTO::fromArray([
            'total_calls' => $callStats->total_calls ?? 0,
            'business_calls' => $callStats->business_calls ?? 0,
            'personal_calls' => $callStats->personal_calls ?? 0,
            'ignored_calls' => $callStats->ignored_calls ?? 0,
            'unclassified_calls' => $callStats->unclassified_calls ?? 0,
            'total_devices' => $totalDevices,
            'active_devices' => $activeDevices,
            'total_agents' => $totalAgents,
            'total_duration_seconds' => $callStats->total_duration_seconds ?? 0,
            'average_call_duration_seconds' => $callStats->average_call_duration_seconds ?? 0,
        ]);
    }
}
