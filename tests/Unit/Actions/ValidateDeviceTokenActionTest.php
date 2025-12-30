<?php

namespace Tests\Unit\Actions;

use App\Actions\Devices\ValidateDeviceTokenAction;
use App\Domain\Devices\DTOs\DeviceTokenValidationResult;
use App\Domain\Devices\Models\DeviceToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ValidateDeviceTokenActionTest extends TestCase
{
    use RefreshDatabase;

    public function test_validates_correct_token()
    {
        $plainToken = Str::random(60);
        $hashedToken = hash('sha256', $plainToken);
        
        $tokenRecord = DeviceToken::factory()->create([
            'token_hash' => $hashedToken,
            'expires_at' => now()->addDay(),
        ]);

        $action = app(ValidateDeviceTokenAction::class);
        $result = $action->execute($plainToken);

        $this->assertTrue($result->isValid);
        $this->assertEquals($tokenRecord->id, $result->tokenId);
        
        // Verify last_used_at updated
        $this->assertNotNull($tokenRecord->fresh()->last_used_at);
    }

    public function test_rejects_expired_token()
    {
        $plainToken = Str::random(60);
        $hashedToken = hash('sha256', $plainToken);
        
        DeviceToken::factory()->expired()->create([
            'token_hash' => $hashedToken,
        ]);

        $action = app(ValidateDeviceTokenAction::class);
        $result = $action->execute($plainToken);

        $this->assertFalse($result->isValid);
        $this->assertEquals(DeviceTokenValidationResult::ERROR_EXPIRED, $result->errorCode);
    }

    public function test_rejects_revoked_token()
    {
        $plainToken = Str::random(60);
        $hashedToken = hash('sha256', $plainToken);
        
        DeviceToken::factory()->revoked()->create([
            'token_hash' => $hashedToken,
        ]);

        $action = app(ValidateDeviceTokenAction::class);
        $result = $action->execute($plainToken);

        $this->assertFalse($result->isValid);
        $this->assertEquals(DeviceTokenValidationResult::ERROR_REVOKED, $result->errorCode);
    }

    public function test_rejects_invalid_token()
    {
        $action = app(ValidateDeviceTokenAction::class);
        $result = $action->execute('invalid-token');

        $this->assertFalse($result->isValid);
        $this->assertEquals(DeviceTokenValidationResult::ERROR_INVALID, $result->errorCode);
    }
}
