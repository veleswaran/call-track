<?php

declare(strict_types=1);

namespace Tests\Unit\Actions\Devices;

use App\Actions\Devices\ValidateDeviceTokenAction;
use App\Domain\Devices\DTOs\DeviceTokenValidationResult;
use App\Domain\Devices\Models\DeviceToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ValidateDeviceTokenActionTest extends TestCase
{
    use RefreshDatabase;

    private ValidateDeviceTokenAction $action;

    protected function setUp(): void
    {
        parent::setUp();
        $this->action = new ValidateDeviceTokenAction;
    }

    public function test_it_returns_invalid_result_for_non_existent_token(): void
    {
        $result = $this->action->execute('non-existent-token');

        $this->assertFalse($result->isValid);
        $this->assertEquals(DeviceTokenValidationResult::ERROR_INVALID, $result->errorCode);
    }

    public function test_it_returns_success_for_valid_token(): void
    {
        $plainToken = 'valid-token';
        $token = DeviceToken::factory()->create([
            'token_hash' => hash('sha256', $plainToken),
            'revoked_at' => null,
            'expires_at' => now()->addDay(),
        ]);

        $result = $this->action->execute($plainToken);

        $this->assertTrue($result->isValid);
        $this->assertEquals($token->device_id, $result->deviceId);
        $this->assertEquals($token->id, $result->tokenId);

        // Assert last_used_at was updated
        $this->assertNotNull($token->fresh()->last_used_at);
    }

    public function test_it_returns_revoked_result_for_revoked_token(): void
    {
        $plainToken = 'revoked-token';
        DeviceToken::factory()->create([
            'token_hash' => hash('sha256', $plainToken),
            'revoked_at' => now(),
        ]);

        $result = $this->action->execute($plainToken);

        $this->assertFalse($result->isValid);
        $this->assertEquals(DeviceTokenValidationResult::ERROR_REVOKED, $result->errorCode);
    }

    public function test_it_returns_expired_result_for_expired_token(): void
    {
        $plainToken = 'expired-token';
        DeviceToken::factory()->create([
            'token_hash' => hash('sha256', $plainToken),
            'expires_at' => now()->subMinute(),
        ]);

        $result = $this->action->execute($plainToken);

        $this->assertFalse($result->isValid);
        $this->assertEquals(DeviceTokenValidationResult::ERROR_EXPIRED, $result->errorCode);
    }
}
