<?php

namespace Tests\Feature;

use App\Domain\Agents\Models\Agent;
use App\Domain\Devices\Models\Device;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class SimSlotTrackingTest extends TestCase
{
    use RefreshDatabase;

    public function test_registers_device_with_tracked_sim_slots()
    {
        $agent = Agent::factory()->create();
        $code = 'AGENT123';
        // Mock validation/creation of code if needed, but simplified here assuming strict checks or mocking
        // Actually, assuming existing RegisterDeviceTest logic works, we just need to test the field saving.
        // We can manually create a code if system requires it.
        // Let's use the actual flow if possible or mock the service.
        // For simplicity in Feature test, we rely on existing robust setup or seed.

        \App\Domain\Devices\Models\DeviceRegistrationCode::create([
            'agent_id' => $agent->id,
            'code' => $code,
            'expires_at' => now()->addHour(),
        ]);

        $payload = [
            'code' => $code,
            'device_uuid' => Str::uuid()->toString(),
            'device_name' => 'Pixel 7',
            'tracked_sim_slots' => [0, 2],
        ];

        $response = $this->postJson('/api/v1/devices/register', $payload);

        $response->assertCreated();

        $device = Device::where('device_uuid', $payload['device_uuid'])->first();
        $this->assertNotNull($device);
        $this->assertEquals([0, 2], $device->tracked_sim_slots);
    }

    public function test_ingests_only_tracked_sim_slots()
    {
        $device = Device::factory()->create([
            'tracked_sim_slots' => [0], // Only SIM 0 tracked
        ]);

        $token = \App\Domain\Devices\Models\DeviceToken::factory()->create(['device_id' => $device->id]);
        $plainToken = 'test-token'; // We need a valid token.
        // Factory hashes it. We need to be able to authenticate.
        // Let's create a token we know the raw value of, or rely on actingAs logic if available for devices.
        // Device auth middleware checks database hash.
        // So we must manually hash a known token.

        $plainToken = Str::random(40);
        $token->update(['token_hash' => hash('sha256', $plainToken)]);

        $logs = [
            [
                'call_hash' => 'hash1',
                'phone_number' => '1234567890',
                'direction' => 'INCOMING',
                'duration' => 60,
                'timestamp' => now()->toIso8601String(),
                'sim_slot' => 0, // Should be accepted
            ],
            [
                'call_hash' => 'hash2',
                'phone_number' => '0987654321',
                'direction' => 'OUTGOING',
                'duration' => 30,
                'timestamp' => now()->toIso8601String(),
                'sim_slot' => 1, // Should be IGNORED
            ],
        ];

        $response = $this->withHeaders(['X-Device-Token' => $plainToken])
            ->postJson('/api/v1/call-logs/sync', ['logs' => $logs]);

        $response->assertOk();

        $this->assertDatabaseHas('call_logs', ['call_hash' => 'hash1']);
        $this->assertDatabaseMissing('call_logs', ['call_hash' => 'hash2']);
    }

    public function test_ingests_all_slots_if_config_is_null()
    {
        $device = Device::factory()->create([
            'tracked_sim_slots' => null, // Default
        ]);

        $token = \App\Domain\Devices\Models\DeviceToken::factory()->create(['device_id' => $device->id]);
        $plainToken = Str::random(40);
        $token->update(['token_hash' => hash('sha256', $plainToken)]);

        $logs = [
            [
                'call_hash' => 'hash3',
                'phone_number' => '111',
                'direction' => 'INCOMING',
                'duration' => 10,
                'timestamp' => now()->toIso8601String(),
                'sim_slot' => 1,
            ],
        ];

        $response = $this->withHeaders(['X-Device-Token' => $plainToken])
            ->postJson('/api/v1/call-logs/sync', ['logs' => $logs]);

        $response->assertOk();
        $this->assertDatabaseHas('call_logs', ['call_hash' => 'hash3']);
    }
}
