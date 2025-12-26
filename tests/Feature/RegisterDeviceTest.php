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
        $payload = [
            'name' => 'Test Device',
            'model' => 'Pixel 8',
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
        ]);

        $token = $response->json('token');
        $this->assertDatabaseHas('device_tokens', [
            'device_name' => 'Test Device',
            'token' => $token,
        ]);
    }

    public function test_it_validates_registration_payload()
    {
        $response = $this->postJson('/api/v1/devices/register', []);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['name', 'model', 'os_version', 'app_version']);
    }
}
