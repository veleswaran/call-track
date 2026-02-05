<?php

namespace Tests\Feature\Api\Devices;

use App\Domain\Devices\Models\Device;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class DeviceRegistrationExtraTest extends TestCase
{
    use RefreshDatabase;

    public function test_device_register_with_extra_metadata(): void
    {
        $agent = \App\Domain\Agents\Models\Agent::factory()->create();
        $code = 'TEST-CODE-123';

        \App\Domain\Devices\Models\DeviceRegistrationCode::create([
            'code' => $code,
            'agent_id' => $agent->id,
            'expires_at' => now()->addHour(),
        ]);

        $payload = [
            'code' => $code,
            'device_uuid' => Str::uuid()->toString(),
            'device_name' => 'Pixel 7',
            'device_model' => 'Google Pixel 7',
            'os_version' => '14.0',
            'app_version' => '1.2.3',
            'tracked_sim_slots' => [0, 1],
            'metadata' => '{"source":"integration-test","run_id":"xyz-123"}',
        ];

        $response = $this->postJson(route('devices.register'), $payload);

        // $response->dump();

        $response->assertStatus(201)
            ->assertJsonStructure([
                'token',
                'device' => [
                    'id',
                    'name',
                    'metadata',
                ],
            ]);

        $this->assertDatabaseHas('devices', [
            'name' => 'Pixel 7',
        ]);

        $device = Device::where('name', 'Pixel 7')->first();
        $this->assertNotNull($device->metadata);
        $this->assertEquals(json_decode($payload['metadata'], true), $device->metadata);
    }
}
