<?php

namespace Tests\Feature;

use App\Domain\Devices\DTOs\DeviceTokenValidationResult;
use App\Domain\Devices\Models\DeviceToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class TokenLifecycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_access_with_valid_token()
    {
        $plainToken = Str::random(60);
        DeviceToken::factory()->create([
            'token_hash' => hash('sha256', $plainToken),
        ]);

        // Mocking a protected endpoint behavior via sync/logs as it uses the middleware
        $response = $this->withHeader('X-Device-Token', $plainToken)
            ->postJson('/api/v1/call-logs/sync', ['logs' => []]);

        // Should pass auth middleware (empty payload will fail validation later, but auth passes)
        $this->assertNotEquals(401, $response->status());
    }

    public function test_access_with_expired_token()
    {
        $plainToken = Str::random(60);
        DeviceToken::factory()->expired()->create([
            'token_hash' => hash('sha256', $plainToken),
        ]);

        $response = $this->withHeader('X-Device-Token', $plainToken)
            ->postJson('/api/v1/call-logs/sync', ['logs' => []]);

        $response->assertUnauthorized()
            ->assertJson([
                'error_code' => DeviceTokenValidationResult::ERROR_EXPIRED,
            ]);
    }

    public function test_access_with_revoked_token()
    {
        $plainToken = Str::random(60);
        DeviceToken::factory()->revoked()->create([
            'token_hash' => hash('sha256', $plainToken),
        ]);

        $response = $this->withHeader('X-Device-Token', $plainToken)
            ->postJson('/api/v1/call-logs/sync', ['logs' => []]);

        $response->assertUnauthorized()
            ->assertJson([
                'error_code' => DeviceTokenValidationResult::ERROR_REVOKED,
            ]);
    }

    public function test_access_with_missing_token()
    {
        $response = $this->postJson('/api/v1/call-logs/sync', ['logs' => []]);

        $response->assertUnauthorized()
            ->assertJson([
                'error_code' => DeviceTokenValidationResult::ERROR_MISSING,
            ]);
    }
}
