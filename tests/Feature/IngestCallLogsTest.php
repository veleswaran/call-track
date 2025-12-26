<?php

namespace Tests\Feature;

use App\Domain\Devices\Models\DeviceToken;
use App\Jobs\ProcessCallLogAnalytics;
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

        $tokenRecord = DeviceToken::factory()->create();
        $token = $tokenRecord->token;

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
            ->postJson('/api/v1/call-logs/bulk', $payload);

        $response->assertOk(); // 200

        $this->assertDatabaseCount('call_logs', 2);
        $this->assertDatabaseHas('call_logs', [
            'device_id' => $tokenRecord->device_id,
            'call_hash' => 'hash-1',
        ]);

        Queue::assertPushed(ProcessCallLogAnalytics::class);
    }

    public function test_it_rejects_invalid_token()
    {
        $payload = ['logs' => []];

        $response = $this->withHeader('X-Device-Token', 'invalid-token')
            ->postJson('/api/v1/call-logs/bulk', $payload);

        $response->assertUnauthorized();
    }

    public function test_it_validates_payload()
    {
        $tokenRecord = DeviceToken::factory()->create();

        $payload = [
            'logs' => [
                [
                    'call_hash' => '', // Empty
                ],
            ],
        ];

        $response = $this->withHeader('X-Device-Token', $tokenRecord->token)
            ->postJson('/api/v1/call-logs/bulk', $payload);

        $response->assertUnprocessable();
    }
}
