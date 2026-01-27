<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Admin;

use App\Domain\Devices\Models\Device;
use App\Domain\Devices\Models\DeviceEvent;
use App\Domain\Users\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeviceEventTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_device_events(): void
    {
        $admin = User::factory()->create();
        $device = Device::factory()->create();

        DeviceEvent::create([
            'device_id' => $device->id,
            'event_type' => 'APP_STOPPED',
            'payload' => ['reason' => 'user_action'],
            'occurred_at' => now(),
        ]);

        DeviceEvent::create([
            'device_id' => $device->id,
            'event_type' => 'PERMISSION_DENIED',
            'payload' => ['permission' => 'READ_CALL_LOG'],
            'occurred_at' => now()->subHour(),
        ]);

        $response = $this->actingAs($admin)
            ->getJson("/api/v1/admin/devices/{$device->id}/events");

        $response->assertOk();
        $response->assertJsonStructure([
            'data' => [
                '*' => ['id', 'device_id', 'event_type', 'payload', 'occurred_at', 'created_at'],
            ],
            'meta' => ['current_page', 'total'],
        ]);
        $response->assertJsonCount(2, 'data');
    }

    public function test_admin_device_events_are_paginated(): void
    {
        $admin = User::factory()->create();
        $device = Device::factory()->create();

        // Create 20 events
        for ($i = 0; $i < 20; $i++) {
            DeviceEvent::create([
                'device_id' => $device->id,
                'event_type' => 'APP_STOPPED',
                'occurred_at' => now()->subMinutes($i),
            ]);
        }

        $response = $this->actingAs($admin)
            ->getJson("/api/v1/admin/devices/{$device->id}/events?per_page=10");

        $response->assertOk();
        $response->assertJsonCount(10, 'data');
        $this->assertEquals(20, $response->json('meta.total'));
        $this->assertEquals(2, $response->json('meta.last_page'));
    }

    public function test_guest_cannot_list_device_events(): void
    {
        $device = Device::factory()->create();

        $response = $this->getJson("/api/v1/admin/devices/{$device->id}/events");

        $response->assertStatus(401);
    }
}
