<?php

namespace Tests\Feature;

use App\Domain\Calls\Models\CallLog;
use App\Domain\Devices\Models\Device;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeviceCallClassificationBatchTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_batches_device_classification()
    {
        \Illuminate\Support\Facades\Queue::fake();

        // 1. Setup Device
        $device = Device::factory()->create();

        // Use separate devices/calls to avoid potential analytics collision in test env,
        // ensuring we test the API batch logic correctly.
        // Actually, DeviceCallClassificationController enforces `device_id` check.
        // So all calls MUST belong to the SAME device (authenticated one).
        // So I MUST use same device.
        // If analytics collision happens, I must fix the collision logic or use distinct DATES.
        // I'll use distinct timestamps to avoid unique constraint on (date, device_id) if the job creates duplicates.

        $call1 = CallLog::factory()->create([
            'device_id' => $device->id,
            'call_hash' => 'hash1',
            'timestamp' => now()->subDay(), // Yesterday
        ]);
        $call2 = CallLog::factory()->create([
            'device_id' => $device->id,
            'call_hash' => 'hash2',
            'timestamp' => now(), // Today
        ]);

        // 2. Payload
        $payload = [
            'classifications' => [
                [
                    'call_hash' => 'hash1',
                    'type' => 'BUSINESS',
                    'note' => 'Note 1',
                ],
                [
                    'call_hash' => 'hash2',
                    'type' => 'PERSONAL',
                    'note' => 'Note 2',
                ],
            ],
        ];

        // 3. API Call (Simulate Device Auth)
        // DeviceAuthMiddleware usually checks 'X-Device-Token'.
        // Assuming factory creates token or we mock middleware/attributes.
        // Let's create a token.
        $token = $device->tokens()->create([
            'token_hash' => hash('sha256', 'token123'),
            'device_name' => 'test',
            'issued_at' => now(),
        ]);

        // Wait, DeviceAuthMiddleware likely verifies plain token against hashed in DB?
        // Let's check Middleware or just force the attribute if possible?
        // Integration tests usually send Header.
        // I'll generate a token properly.

        $response = $this->withHeader('X-Device-Token', 'token123')
            ->postJson('/api/v1/call-logs/classify', $payload);

        // 4. Assertions
        $response->assertStatus(200);

        $this->assertDatabaseHas('call_classifications', [
            'call_log_id' => $call1->id,
            'type' => 'BUSINESS',
        ]);

        $this->assertDatabaseHas('call_notes', [
            'call_log_id' => $call1->id,
            'note' => 'Note 1',
        ]);

        $this->assertDatabaseHas('call_classifications', [
            'call_log_id' => $call2->id,
            'type' => 'PERSONAL',
        ]);

        $this->assertDatabaseHas('call_notes', [
            'call_log_id' => $call2->id,
            'note' => 'Note 2',
        ]);
    }
}
