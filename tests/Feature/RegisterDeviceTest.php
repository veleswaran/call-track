<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class RegisterDeviceTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function test_it_registers_a_new_device()
    {
        $agent = \App\Domain\Agents\Models\Agent::factory()->create();
        $code = \App\Domain\Devices\Models\DeviceRegistrationCode::create([
            'code' => 'TESTCODE',
            'agent_id' => $agent->id,
            'expires_at' => now()->addHour(),
        ]);

        $payload = [
            'code' => 'TESTCODE',
            'device_name' => 'Test Device',
            'device_model' => 'Pixel 8',
            'os_version' => 'Android 14',
            'app_version' => '1.0.0',
        ];

        $response = $this->postJson('/api/v1/devices/register', $payload);

        $response->assertCreated()
            ->assertJsonStructure([
                'message',
                'device_id',
                'token',
            ]);

        $this->assertDatabaseHas('devices', [
            'name' => 'Test Device',
            'model' => 'Pixel 8',
            'agent_id' => $agent->id,
        ]);

        $token = $response->json('token');
        // Token is hashed in DB now, so we can't search by plain token
        // But we can check if device exists
        $this->assertDatabaseHas('devices', ['id' => $response->json('device_id')]);
    }

    public function test_it_validates_registration_payload()
    {
        $response = $this->postJson('/api/v1/devices/register', []);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['code', 'device_name']);
    }
}
