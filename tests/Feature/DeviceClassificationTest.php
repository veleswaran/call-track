<?php

namespace Tests\Feature;

use App\Domain\Agents\Models\Agent;
use App\Domain\Calls\Models\CallLog;
use App\Domain\Devices\Models\Device;
use App\Domain\Devices\Models\DeviceToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class DeviceClassificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_device_can_classify_and_annotate_its_call()
    {
        $agent = Agent::factory()->create();
        $device = Device::factory()->create(['agent_id' => $agent->id]);
        $plainToken = Str::random(60);
        DeviceToken::factory()->create([
            'device_id' => $device->id,
            'token_hash' => hash('sha256', $plainToken),
        ]);

        $callLog = CallLog::factory()->create([
            'device_id' => $device->id,
            'call_hash' => 'hash-123',
        ]);

        $payload = [
            'type' => 'BUSINESS',
            'note' => 'Client meeting discussion',
        ];

        $response = $this->withHeader('X-Device-Token', $plainToken)
            ->postJson("/api/v1/call-logs/{$callLog->call_hash}/classify", $payload);

        $response->assertOk();

        $this->assertDatabaseHas('call_classifications', [
            'call_log_id' => $callLog->id,
            'agent_id' => $agent->id,
            'type' => 'BUSINESS',
            'note' => 'Client meeting discussion',
            'user_id' => null,
        ]);
    }

    public function test_device_cannot_classify_others_calls()
    {
        $device1 = Device::factory()->create();
        $plainToken = Str::random(60);
        DeviceToken::factory()->create([
            'device_id' => $device1->id,
            'token_hash' => hash('sha256', $plainToken),
        ]);

        $device2 = Device::factory()->create();
        $callLog2 = CallLog::factory()->create([
            'device_id' => $device2->id, // Belongs to device 2
            'call_hash' => 'hash-456',
        ]);

        $response = $this->withHeader('X-Device-Token', $plainToken)
            ->postJson("/api/v1/call-logs/{$callLog2->call_hash}/classify", ['type' => 'PERSONAL']);

        $response->assertNotFound(); // Or Forbidden, but we used where()->firstOrFail() so likely 404
    }
}
