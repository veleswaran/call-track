<?php

declare(strict_types=1);

namespace Tests\Feature\Actions\Devices;

use App\Actions\Devices\FindStaleHeartbeatDevicesAction;
use App\Domain\Devices\Models\Device;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class FindStaleHeartbeatDevicesActionTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_finds_stale_devices_with_fcm_tokens(): void
    {
        Carbon::setTestNow('2026-01-01 12:00:00');

        // Should be found: Stale, has FCM token, has an active token (created via factory default)
        $staleDevice = Device::factory()->create([
            'last_heartbeat_at' => Carbon::parse('2026-01-01 10:00:00'),
            'fcm_token' => 'stale-token',
        ]);
        \App\Domain\Devices\Models\DeviceToken::factory()->create(['device_id' => $staleDevice->id, 'expires_at' => now()->addDays(7)]);

        // Should not be found: Not stale
        $recentDevice = Device::factory()->create([
            'last_heartbeat_at' => Carbon::parse('2026-01-01 11:30:00'),
            'fcm_token' => 'recent-token',
        ]);
        \App\Domain\Devices\Models\DeviceToken::factory()->create(['device_id' => $recentDevice->id, 'expires_at' => now()->addDays(7)]);

        // Should not be found: Stale but no FCM token
        $noFcmDevice = Device::factory()->create([
            'last_heartbeat_at' => Carbon::parse('2026-01-01 10:00:00'),
            'fcm_token' => null,
        ]);
        \App\Domain\Devices\Models\DeviceToken::factory()->create(['device_id' => $noFcmDevice->id, 'expires_at' => now()->addDays(7)]);

        // Should not be found: Stale, has FCM token, but NO active device token
        $inactiveDevice = Device::factory()->create([
            'last_heartbeat_at' => Carbon::parse('2026-01-01 10:00:00'),
            'fcm_token' => 'inactive-token',
        ]);
        // No DeviceToken created for this one

        $action = new FindStaleHeartbeatDevicesAction;
        // default is 60 mins
        $staleDevices = $action->execute();

        $this->assertCount(1, $staleDevices);
        $this->assertEquals($staleDevice->id, $staleDevices->first()->id);
    }
}
