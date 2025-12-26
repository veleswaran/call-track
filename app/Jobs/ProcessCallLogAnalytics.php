<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ProcessCallLogAnalytics implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public int $deviceId
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Simple aggregation example
        // In reality, this might be more complex or incremental

        $today = now()->toDateString();

        // This is a naive implementation re-calculating everything for the day.
        $stats = \Illuminate\Support\Facades\DB::table('call_logs')
            ->where('device_id', $this->deviceId)
            ->whereDate('timestamp', $today)
            ->selectRaw('
                COUNT(*) as total_calls,
                SUM(duration) as total_duration
            ')
            ->first();

        // Count classifications
        // This query needs to join with classification table
        $classifications = \Illuminate\Support\Facades\DB::table('call_logs')
            ->join('call_classifications', 'call_logs.id', '=', 'call_classifications.call_log_id')
            ->where('call_logs.device_id', $this->deviceId)
            ->whereDate('call_logs.timestamp', $today)
            ->selectRaw('
                SUM(CASE WHEN type = "BUSINESS" THEN 1 ELSE 0 END) as business_calls,
                SUM(CASE WHEN type = "PERSONAL" THEN 1 ELSE 0 END) as personal_calls,
                SUM(CASE WHEN type = "IGNORED" THEN 1 ELSE 0 END) as ignored_calls
            ')
            ->first();

        \App\Domain\Analytics\Models\AnalyticsDaily::updateOrCreate(
            [
                'date' => $today,
                'device_id' => $this->deviceId,
            ],
            [
                'total_calls' => $stats->total_calls ?? 0,
                'total_duration' => $stats->total_duration ?? 0,
                'business_calls' => $classifications->business_calls ?? 0,
                'personal_calls' => $classifications->personal_calls ?? 0,
                'ignored_calls' => $classifications->ignored_calls ?? 0,
            ]
        );
    }
}
