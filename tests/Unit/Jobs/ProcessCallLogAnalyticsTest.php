<?php

namespace Tests\Unit\Jobs;

use App\Domain\Calls\Models\CallLog;
use App\Domain\Classification\Models\CallClassification;
use App\Domain\Devices\Models\Device;
use App\Jobs\ProcessCallLogAnalytics;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProcessCallLogAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_aggregates_stats_for_today()
    {
        $device = Device::factory()->create();
        $otherDevice = Device::factory()->create();

        // Today's logs for device
        // 1. Unclassified, duration 100
        CallLog::factory()->create([
            'device_id' => $device->id,
            'duration' => 100,
            'timestamp' => now()->startOfDay()->addHour(),
        ]);

        $admin = \App\Domain\Users\Models\User::factory()->create();

        // 2. Business, duration 200
        $log2 = CallLog::factory()->create([
            'device_id' => $device->id,
            'duration' => 200,
            'timestamp' => now()->startOfDay()->addHours(2),
        ]);
        CallClassification::factory()->create([
            'call_log_id' => $log2->id,
            'type' => 'BUSINESS',
            'user_id' => $admin->id, 
        ]);

        // 3. Personal, duration 50
        $log3 = CallLog::factory()->create([
            'device_id' => $device->id,
            'duration' => 50,
            'timestamp' => now()->startOfDay()->addHours(3),
        ]);
        CallClassification::factory()->create([
            'call_log_id' => $log3->id,
            'type' => 'PERSONAL',
            'user_id' => $admin->id,
        ]);

        // Yesterday's logs (Should check ignored)
        CallLog::factory()->create([
            'device_id' => $device->id,
             'duration' => 500,
            'timestamp' => now()->subDay(),
        ]);

        // Other device logs (Should be ignored)
        CallLog::factory()->create([
            'device_id' => $otherDevice->id,
            'duration' => 999,
            'timestamp' => now(),
        ]);

        // Run Job
        $job = new ProcessCallLogAnalytics($device->id);
        $job->handle();

        $this->assertDatabaseHas('analytics_daily', [
            'device_id' => $device->id,
            'date' => now()->startOfDay()->toDateTimeString(),
            'total_calls' => 3, // 100 + 200 + 50
            'total_duration' => 350,
            'business_calls' => 1,
            'personal_calls' => 1,
            'ignored_calls' => 0,
        ]);
        
        // Assert no record for yesterday (unless already existed, but here we check handled logic)
        // Since logic only touches "Today", we ensure we didn't accidentally create yesterday stats here.
        $this->assertDatabaseMissing('analytics_daily', [
            'device_id' => $device->id,
            'date' => now()->subDay()->toDateString(),
        ]);
    }
}
