<?php

declare(strict_types=1);

namespace Tests\Feature\Middleware;

use App\Domain\Devices\Models\Device;
use App\Domain\Devices\Models\DeviceToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeviceAuthMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_protects_device_routes(): void
    {
        // /v1/call-logs/sync is a protected route
        $response = $this->postJson('/api/v1/call-logs/sync', ['logs' => []]);

        $response->assertUnauthorized();
        $response->assertJson(['message' => 'Device Token Missing']);
    }

    public function test_it_allows_valid_token(): void
    {
        $device = Device::factory()->create();
        $plainToken = 'valid-token';
        DeviceToken::factory()->create([
            'device_id' => $device->id,
            'token_hash' => hash('sha256', $plainToken),
            'expires_at' => now()->addDay(),
            'revoked_at' => null,
        ]);

        $response = $this->withHeader('X-Device-Token', $plainToken)
            ->postJson('/api/v1/call-logs/sync', ['logs' => []]);

        $response->assertOk();
    }

    public function test_it_rejects_expired_token(): void
    {
        $device = Device::factory()->create();
        $plainToken = 'expired-token';
        DeviceToken::factory()->create([
            'device_id' => $device->id,
            'token_hash' => hash('sha256', $plainToken),
            'expires_at' => now()->subMinute(),
        ]);

        $response = $this->withHeader('X-Device-Token', $plainToken)
            ->postJson('/api/v1/call-logs/sync', ['logs' => []]);

        $response->assertUnauthorized();
        $response->assertJson(['error_code' => 'TOKEN_EXPIRED']);
    }

    public function test_it_rejects_revoked_token(): void
    {
        $device = Device::factory()->create();
        $plainToken = 'revoked-token';
        DeviceToken::factory()->create([
            'device_id' => $device->id,
            'token_hash' => hash('sha256', $plainToken),
            'revoked_at' => now(),
        ]);

        $response = $this->withHeader('X-Device-Token', $plainToken)
            ->postJson('/api/v1/call-logs/sync', ['logs' => []]);

        $response->assertUnauthorized();
        $response->assertJson(['error_code' => 'TOKEN_REVOKED']);
    }

    public function test_it_rejects_invalid_token(): void
    {
        $response = $this->withHeader('X-Device-Token', 'wrong-token')
            ->postJson('/api/v1/call-logs/sync', ['logs' => []]);

        $response->assertUnauthorized();
        $response->assertJson(['error_code' => 'TOKEN_INVALID']);
    }
}
