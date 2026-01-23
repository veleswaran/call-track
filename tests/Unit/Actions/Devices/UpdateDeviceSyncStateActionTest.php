<?php

declare(strict_types=1);

namespace Tests\Unit\Actions\Devices;

use App\Actions\Devices\UpdateDeviceSyncStateAction;
use App\Domain\Devices\Models\Device;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class UpdateDeviceSyncStateActionTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_updates_heartbeat_timestamp(): void
    {
        Carbon::setTestNow('2026-01-19 10:00:00');

        $device = Device::factory()->create([
            'last_heartbeat_at' => null,
            'battery_level' => null,
        ]);

        $action = new UpdateDeviceSyncStateAction;
        $action->execute($device);

        $device->refresh();

        $this->assertNotNull($device->last_heartbeat_at);
        $this->assertEquals('2026-01-19 10:00:00', $device->last_heartbeat_at->format('Y-m-d H:i:s'));
        $this->assertNull($device->battery_level);

        Carbon::setTestNow();
    }

    public function test_it_updates_heartbeat_and_battery_in_single_query(): void
    {
        Carbon::setTestNow('2026-01-19 12:00:00');

        $device = Device::factory()->create([
            'last_heartbeat_at' => Carbon::parse('2026-01-19 08:00:00'),
            'battery_level' => 50,
        ]);

        $action = new UpdateDeviceSyncStateAction;
        $action->execute($device, 85);

        $device->refresh();

        $this->assertEquals('2026-01-19 12:00:00', $device->last_heartbeat_at->format('Y-m-d H:i:s'));
        $this->assertEquals(85, $device->battery_level);

        Carbon::setTestNow();
    }

    public function test_it_does_not_update_battery_when_null(): void
    {
        Carbon::setTestNow('2026-01-19 14:00:00');

        $device = Device::factory()->create([
            'last_heartbeat_at' => null,
            'battery_level' => 75,
        ]);

        $action = new UpdateDeviceSyncStateAction;
        $action->execute($device, null);

        $device->refresh();

        // Heartbeat should be updated
        $this->assertEquals('2026-01-19 14:00:00', $device->last_heartbeat_at->format('Y-m-d H:i:s'));
        // Battery should remain unchanged
        $this->assertEquals(75, $device->battery_level);

        Carbon::setTestNow();
    }
}
