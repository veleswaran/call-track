<?php

declare(strict_types=1);

namespace Tests\Unit\Actions\Devices;

use App\Actions\Devices\UpdateDeviceHeartbeatAction;
use App\Domain\Devices\Models\Device;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class UpdateDeviceHeartbeatActionTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_updates_device_heartbeat_timestamp(): void
    {
        Carbon::setTestNow('2026-01-19 10:00:00');

        $device = Device::factory()->create([
            'last_heartbeat_at' => null,
        ]);

        $action = new UpdateDeviceHeartbeatAction;
        $action->execute($device);

        $device->refresh();

        $this->assertNotNull($device->last_heartbeat_at);
        $this->assertEquals('2026-01-19 10:00:00', $device->last_heartbeat_at->format('Y-m-d H:i:s'));

        Carbon::setTestNow(); // Reset
    }

    public function test_it_overwrites_existing_heartbeat(): void
    {
        Carbon::setTestNow('2026-01-19 12:00:00');

        $device = Device::factory()->create([
            'last_heartbeat_at' => Carbon::parse('2026-01-19 08:00:00'),
        ]);

        $action = new UpdateDeviceHeartbeatAction;
        $action->execute($device);

        $device->refresh();

        $this->assertEquals('2026-01-19 12:00:00', $device->last_heartbeat_at->format('Y-m-d H:i:s'));

        Carbon::setTestNow(); // Reset
    }
}
