<?php

declare(strict_types=1);

namespace Tests\Unit\Actions\Devices;

use App\Domain\Devices\Actions\StoreDeviceEventAction;
use App\Domain\Devices\DTOs\StoreDeviceEventDTO;
use App\Domain\Devices\Models\Device;
use App\Domain\Devices\Models\DeviceEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class StoreDeviceEventActionTest extends TestCase
{
    use RefreshDatabase;

    private StoreDeviceEventAction $action;

    protected function setUp(): void
    {
        parent::setUp();
        $this->action = new StoreDeviceEventAction;
    }

    public function test_it_creates_a_device_event(): void
    {
        $device = Device::factory()->create();
        $occurredAt = Carbon::now();

        $dto = new StoreDeviceEventDTO(
            deviceId: $device->id,
            eventType: 'APP_STOPPED',
            payload: ['reason' => 'user_action'],
            occurredAt: $occurredAt,
        );

        $event = $this->action->execute($dto);

        $this->assertInstanceOf(DeviceEvent::class, $event);
        $this->assertEquals($device->id, $event->device_id);
        $this->assertEquals('APP_STOPPED', $event->event_type);
        $this->assertEquals(['reason' => 'user_action'], $event->payload);
        $this->assertDatabaseHas('device_events', [
            'device_id' => $device->id,
            'event_type' => 'APP_STOPPED',
        ]);
    }

    public function test_it_is_idempotent_for_same_device_event_timestamp(): void
    {
        $device = Device::factory()->create();
        $occurredAt = Carbon::parse('2026-01-20 12:00:00');

        $dto = new StoreDeviceEventDTO(
            deviceId: $device->id,
            eventType: 'PERMISSION_DENIED',
            payload: ['permission' => 'READ_CALL_LOG'],
            occurredAt: $occurredAt,
        );

        // Execute twice with same data
        $event1 = $this->action->execute($dto);
        $event2 = $this->action->execute($dto);

        // Should return same event (idempotent)
        $this->assertEquals($event1->id, $event2->id);
        $this->assertEquals(1, DeviceEvent::where('device_id', $device->id)->count());
    }

    public function test_it_creates_separate_events_for_different_timestamps(): void
    {
        $device = Device::factory()->create();

        $dto1 = new StoreDeviceEventDTO(
            deviceId: $device->id,
            eventType: 'APP_STOPPED',
            payload: null,
            occurredAt: Carbon::parse('2026-01-20 12:00:00'),
        );

        $dto2 = new StoreDeviceEventDTO(
            deviceId: $device->id,
            eventType: 'APP_STOPPED',
            payload: null,
            occurredAt: Carbon::parse('2026-01-20 13:00:00'),
        );

        $this->action->execute($dto1);
        $this->action->execute($dto2);

        $this->assertEquals(2, DeviceEvent::where('device_id', $device->id)->count());
    }
}
