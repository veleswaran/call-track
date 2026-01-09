<?php

namespace Tests\Feature;

use App\Domain\Devices\Models\DeviceToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class IngestCallLogsTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function test_it_ingests_call_logs_via_api()
    {
        Queue::fake();

        $plainToken = \Illuminate\Support\Str::random(60);
        $tokenRecord = DeviceToken::factory()->create([
            'token_hash' => hash('sha256', $plainToken),
        ]);
        $token = $plainToken;

        $payload = [
            'logs' => [
                [
                    'call_hash' => 'hash-1',
                    'phone_number' => '+15550100',
                    'direction' => 'INCOMING',
                    'duration' => 60,
                    'timestamp' => now()->toDateTimeString(),
                ],
                [
                    'call_hash' => 'hash-2',
                    'phone_number' => '+15550101',
                    'direction' => 'OUTGOING',
                    'duration' => 120,
                    'timestamp' => now()->subHour()->toDateTimeString(),
                ],
            ],
        ];

        $response = $this->withHeader('X-Device-Token', $token)
            ->postJson('/api/v1/call-logs/sync', $payload);

        $response->assertOk(); // 200

        $this->assertDatabaseCount('call_logs', 2);
        $this->assertDatabaseHas('call_logs', [
            'device_id' => $tokenRecord->device_id,
            'call_hash' => 'hash-1',
        ]);

        // Check if default classification is created
        $log = \App\Domain\Calls\Models\CallLog::where('call_hash', 'hash-1')->first();
        $this->assertDatabaseHas('call_classifications', [
            'call_log_id' => $log->id,
            'type' => 'BUSINESS',
            'user_id' => null,
            'agent_id' => null,
        ]);
    }

    public function test_it_rejects_invalid_token()
    {
        $payload = ['logs' => []];

        $response = $this->withHeader('X-Device-Token', 'invalid-token')
            ->postJson('/api/v1/call-logs/sync', $payload);

        $response->assertUnauthorized();
    }

    public function test_it_validates_payload()
    {
        $plainToken = \Illuminate\Support\Str::random(60);
        $tokenRecord = DeviceToken::factory()->create([
            'token_hash' => hash('sha256', $plainToken),
        ]);

        $payload = [
            'logs' => [
                [
                    'call_hash' => '', // Empty
                ],
            ],
        ];

        $response = $this->withHeader('X-Device-Token', $plainToken)
            ->postJson('/api/v1/call-logs/sync', $payload);

        $response->assertUnprocessable();
    }

    public function test_it_updates_device_battery_level_during_sync()
    {
        $plainToken = \Illuminate\Support\Str::random(60);
        $tokenRecord = DeviceToken::factory()->create([
            'token_hash' => hash('sha256', $plainToken),
        ]);

        $payload = [
            'battery_level' => 85,
            'logs' => [],
        ];

        $response = $this->withHeader('X-Device-Token', $plainToken)
            ->postJson('/api/v1/call-logs/sync', $payload);

        $response->assertOk();

        $this->assertDatabaseHas('devices', [
            'id' => $tokenRecord->device_id,
            'battery_level' => 85,
        ]);
    }

    public function test_it_applies_inline_classification_during_sync()
    {
        Queue::fake();

        $plainToken = \Illuminate\Support\Str::random(60);
        $tokenRecord = DeviceToken::factory()->create([
            'token_hash' => hash('sha256', $plainToken),
        ]);

        $payload = [
            'logs' => [
                [
                    'call_hash' => 'classified-hash-1',
                    'phone_number' => '+15550200',
                    'direction' => 'OUTGOING',
                    'duration' => 120,
                    'timestamp' => now()->toDateTimeString(),
                    'classification' => [
                        'type' => 'PERSONAL',
                        'note' => 'Personal call to family',
                    ],
                ],
            ],
        ];

        $response = $this->withHeader('X-Device-Token', $plainToken)
            ->postJson('/api/v1/call-logs/sync', $payload);

        $response->assertOk();

        // Verify call log was created
        $log = \App\Domain\Calls\Models\CallLog::where('call_hash', 'classified-hash-1')->first();
        $this->assertNotNull($log);

        // Verify classification is PERSONAL (not default BUSINESS)
        $this->assertDatabaseHas('call_classifications', [
            'call_log_id' => $log->id,
            'type' => 'PERSONAL',
        ]);

        // Verify note was created
        $this->assertDatabaseHas('call_notes', [
            'call_log_id' => $log->id,
            'note' => 'Personal call to family',
        ]);
    }
}
