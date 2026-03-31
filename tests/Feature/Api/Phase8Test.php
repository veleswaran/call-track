<?php

namespace Tests\Feature\Api;

use App\Domain\Agents\Models\Agent;
use App\Domain\Devices\Models\DeviceRegistrationCode;
use App\Domain\Users\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class Phase8Test extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_generate_registration_code()
    {
        $admin = User::factory()->create();
        $agent = Agent::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/devices/codes', [
                'agent_id' => $agent->id,
                'expires_in_hours' => 24,
            ]);

        $response->assertCreated()
            ->assertJsonStructure(['data' => ['code', 'expires_at']]);

        $this->assertDatabaseHas('device_registration_codes', [
            'agent_id' => $agent->id,
        ]);
    }

    public function test_device_can_register_with_code()
    {
        $agent = Agent::factory()->create();
        $code = DeviceRegistrationCode::create([
            'code' => 'ABC123',
            'agent_id' => $agent->id,
            'expires_at' => now()->addHour(),
        ]);

        $response = $this->postJson('/api/v1/devices/register', [
            'code' => 'ABC123',
            'device_uuid' => Str::uuid()->toString(),
            'device_name' => 'Test Device',
            'device_model' => 'Pixel 7',
        ]);

        $response->assertCreated()
            ->assertJsonStructure(['token', 'device_id']);

        $this->assertDatabaseHas('devices', ['name' => 'Test Device', 'agent_id' => $agent->id]);
        $this->assertNotNull(DeviceRegistrationCode::first()->used_at);
    }

    public function test_device_can_sync_call_logs()
    {
        // 1. Register device to get token
        $agent = Agent::factory()->create();
        $code = DeviceRegistrationCode::create([
            'code' => 'SYNC01',
            'agent_id' => $agent->id,
            'expires_at' => now()->addHour(),
        ]);

        $regResponse = $this->postJson('/api/v1/devices/register', [
            'code' => 'SYNC01',
            'device_uuid' => Str::uuid()->toString(),
            'device_name' => 'Sync Device',
        ]);
        $token = $regResponse->json('token');
        $deviceId = $regResponse->json('device_id');

        // 2. Sync logs
        $logs = [
            [
                'call_hash' => Str::random(10),
                'phone_number' => '+15550001111',
                'direction' => 'INCOMING',
                'duration' => 60,
                'timestamp' => now()->toIso8601String(),
                'sim_slot' => 1,
            ],
        ];

        $response = $this->withHeader('X-Device-Token', $token)
            ->postJson('/api/v1/call-logs/sync', ['logs' => $logs]);

        $response->assertOk();
        $this->assertDatabaseHas('call_logs', [
            'device_id' => $deviceId,
            'sim_slot' => 1,
            // 'phone_number' => '+15550001111' // Can't query encrypted directly unless we use model
        ]);

        // Check encrypted column via Model
        $log = \App\Domain\Calls\Models\CallLog::first();
        $this->assertEquals('+15550001111', $log->phone_number);
    }

    public function test_admin_can_manage_contacts()
    {
        $admin = User::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/contacts', [
                'name' => 'John Doe',
                'phone_number' => '+15559998888',
                'is_internal' => false,
            ]);

        $response->assertCreated();
        $this->assertDatabaseHas('contacts', [
            'name' => 'John Doe',
        ]);
    }
}
