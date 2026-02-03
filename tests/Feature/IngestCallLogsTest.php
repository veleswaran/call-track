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

    public function test_it_updates_device_heartbeat_during_sync()
    {
        \Illuminate\Support\Carbon::setTestNow('2026-01-19 10:00:00');

        $plainToken = \Illuminate\Support\Str::random(60);
        $tokenRecord = DeviceToken::factory()->create([
            'token_hash' => hash('sha256', $plainToken),
        ]);

        // Sync with empty logs should still update heartbeat
        $payload = ['logs' => []];

        $response = $this->withHeader('X-Device-Token', $plainToken)
            ->postJson('/api/v1/call-logs/sync', $payload);

        $response->assertOk();

        $device = $tokenRecord->device->fresh();
        $this->assertNotNull($device->last_heartbeat_at);
        $this->assertEquals('2026-01-19 10:00:00', $device->last_heartbeat_at->format('Y-m-d H:i:s'));

        \Illuminate\Support\Carbon::setTestNow(); // Reset
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
                    'extra' => [
                        'classification' => 'PERSONAL',
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

        // Verify note was stored in classification
        $this->assertDatabaseHas('call_classifications', [
            'call_log_id' => $log->id,
            'type' => 'PERSONAL',
            'note' => 'Personal call to family',
        ]);
    }

    public function test_it_ingests_unknown_direction_and_metadata()
    {
        Queue::fake();

        $plainToken = \Illuminate\Support\Str::random(60);
        $tokenRecord = DeviceToken::factory()->create([
            'token_hash' => hash('sha256', $plainToken),
        ]);

        $payload = [
            'logs' => [
                [
                    'call_hash' => 'unknown-hash-1',
                    'phone_number' => '+15550300',
                    'direction' => 'UNKNOWN',
                    'duration' => 0,
                    'timestamp' => now()->toDateTimeString(),
                    'extra' => [
                        'classification' => 'IGNORED',
                        'metadata' => 'Blocked by spam filter',
                    ],
                ],
            ],
        ];

        $response = $this->withHeader('X-Device-Token', $plainToken)
            ->postJson('/api/v1/call-logs/sync', $payload);

        $response->assertOk();

        // Verify call log was created
        $log = \App\Domain\Calls\Models\CallLog::where('call_hash', 'unknown-hash-1')->first();
        $this->assertNotNull($log);
        $this->assertEquals('UNKNOWN', $log->direction);

        // Verify classification is IGNORED
        $this->assertDatabaseHas('call_classifications', [
            'call_log_id' => $log->id,
            'type' => 'IGNORED',
        ]);

        // Verify metadata was stored in classification
        $this->assertDatabaseHas('call_classifications', [
            'call_log_id' => $log->id,
            'type' => 'IGNORED',
        ]);

        // Check classification has metadata
        $classification = \App\Domain\Classification\Models\CallClassification::where('call_log_id', $log->id)->first();
        $this->assertNotNull($classification->metadata);
        $this->assertEquals('Blocked by spam filter', $classification->metadata);
    }

    public function test_it_ingests_phone_contact_name()
    {
        Queue::fake();

        $plainToken = \Illuminate\Support\Str::random(60);
        $tokenRecord = DeviceToken::factory()->create([
            'token_hash' => hash('sha256', $plainToken),
        ]);

        $payload = [
            'logs' => [
                [
                    'call_hash' => 'contact-name-hash-1',
                    'phone_number' => '+15559999',
                    'phone_contact_name' => 'John Doe Sync',
                    'direction' => 'INCOMING',
                    'duration' => 45,
                    'timestamp' => now()->toDateTimeString(),
                ],
            ],
        ];

        $response = $this->withHeader('X-Device-Token', $plainToken)
            ->postJson('/api/v1/call-logs/sync', $payload);

        $response->assertOk();

        $this->assertDatabaseHas('call_logs', [
            'call_hash' => 'contact-name-hash-1',
            'phone_contact_name' => 'John Doe Sync',
        ]);
    }
}
