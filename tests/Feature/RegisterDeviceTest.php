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
            'device_uuid' => \Illuminate\Support\Str::uuid()->toString(),
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
            'device_uuid' => $payload['device_uuid'],
        ]);

        $token = $response->json('token');
        // Verify token is hashed in DB
        // Query by device_id since token is hashed
        $this->assertDatabaseHas('device_tokens', [
            'device_id' => $response->json('device_id'),
            // 'token_hash' => ... hard to verify hash without knowing what it hashed to, but we can verify record exists
        ]);

        $deviceToken = \App\Domain\Devices\Models\DeviceToken::where('device_id', $response->json('device_id'))->first();
        $this->assertEquals(hash('sha256', $token), $deviceToken->token_hash);
        $this->assertNotNull($deviceToken->issued_at);
        $this->assertNotNull($deviceToken->expires_at);
    }

    public function test_it_validates_registration_payload()
    {
        $response = $this->postJson('/api/v1/devices/register', []);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['code', 'device_name', 'device_uuid']);
    }

    public function test_it_handles_re_registration_safely()
    {
        // 1. Initial Registration
        $agent = \App\Domain\Agents\Models\Agent::factory()->create();
        $code = \App\Domain\Devices\Models\DeviceRegistrationCode::create([
            'code' => 'CODE1',
            'agent_id' => $agent->id,
            'expires_at' => now()->addHour(),
        ]);

        $uuid = \Illuminate\Support\Str::uuid()->toString();

        $payload1 = [
            'code' => 'CODE1',
            'device_uuid' => $uuid,
            'device_name' => 'Device v1',
        ];

        $response1 = $this->postJson('/api/v1/devices/register', $payload1);
        $deviceId = $response1->json('device_id');
        $token1 = $response1->json('token');

        // 2. Re-register with new code but same UUID
        $code2 = \App\Domain\Devices\Models\DeviceRegistrationCode::create([
            'code' => 'CODE2',
            'agent_id' => $agent->id,
            'expires_at' => now()->addHour(),
        ]);

        $payload2 = [
            'code' => 'CODE2',
            'device_uuid' => $uuid,
            'device_name' => 'Device v2', // Name changed
        ];

        $response2 = $this->postJson('/api/v1/devices/register', $payload2);
        $response2->assertStatus(201);

        // Assert SAME device ID reused
        $this->assertEquals($deviceId, $response2->json('device_id'));

        // Assert NEW token issued
        $token2 = $response2->json('token');
        $this->assertNotEquals($token1, $token2);

        // Assert Old token revoked
        $hashedToken1 = hash('sha256', $token1);
        $this->assertDatabaseHas('device_tokens', [
            'token_hash' => $hashedToken1,
            'revoked_at' => now(), // Approximate check, effectively not null
        ]);
        $this->assertTrue(\App\Domain\Devices\Models\DeviceToken::where('token_hash', $hashedToken1)->first()->isRevoked());

        // Assert Device name updated
        $this->assertDatabaseHas('devices', [
            'id' => $deviceId,
            'name' => 'Device v2',
        ]);
    }
}
