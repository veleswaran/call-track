<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Device;

use App\Domain\Devices\Models\Device;
use App\Domain\Devices\Models\DeviceToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class DeviceEventTest extends TestCase
{
    use RefreshDatabase;

    public function test_device_can_submit_event(): void
    {
        $plainToken = Str::random(60);
        $device = Device::factory()->create();
        DeviceToken::factory()->for($device)->create([
            'token_hash' => hash('sha256', $plainToken),
        ]);

        $response = $this->withHeader('X-Device-Token', $plainToken)
            ->postJson('/api/v1/device/events', [
                'event_type' => 'APP_STOPPED',
                'payload' => ['reason' => 'user_action'],
                'occurred_at' => '2026-01-20T12:00:00Z',
            ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'message',
            'data' => ['id', 'event_type', 'occurred_at'],
        ]);

        $this->assertDatabaseHas('device_events', [
            'device_id' => $device->id,
            'event_type' => 'APP_STOPPED',
        ]);
    }

    public function test_device_event_accepts_custom_event_type(): void
    {
        $plainToken = Str::random(60);
        $device = Device::factory()->create();
        DeviceToken::factory()->for($device)->create([
            'token_hash' => hash('sha256', $plainToken),
        ]);

        $customEventType = 'CUSTOM_MOBILE_EVENT_'.Str::upper(Str::random(5));

        $response = $this->withHeader('X-Device-Token', $plainToken)
            ->postJson('/api/v1/device/events', [
                'event_type' => $customEventType,
                'payload' => ['foo' => 'bar'],
                'occurred_at' => '2026-01-20T12:00:00Z',
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('device_events', [
            'device_id' => $device->id,
            'event_type' => $customEventType,
        ]);
    }

    public function test_unauthenticated_device_cannot_submit_event(): void
    {
        $response = $this->postJson('/api/v1/device/events', [
            'event_type' => 'APP_STOPPED',
            'occurred_at' => '2026-01-20T12:00:00Z',
        ]);

        $response->assertStatus(401);
    }
}
