<?php

declare(strict_types=1);

namespace App\Actions\Devices;

use App\Domain\Devices\DTOs\DeviceTokenValidationResult;
use App\Domain\Devices\Models\DeviceToken;

/**
 * Validates a device token and returns detailed validation result.
 * Updates last_used_at for valid tokens.
 */
class ValidateDeviceTokenAction
{
    /**
     * Validate the provided plain text token.
     */
    public function execute(string $plainTextToken): DeviceTokenValidationResult
    {
        $hashedToken = hash('sha256', $plainTextToken);

        $token = DeviceToken::with('device')
            ->where('token_hash', $hashedToken)
            ->first();

        if ($token === null) {
            return DeviceTokenValidationResult::failure(
                DeviceTokenValidationResult::ERROR_INVALID
            );
        }

        if ($token->isRevoked()) {
            return DeviceTokenValidationResult::failure(
                DeviceTokenValidationResult::ERROR_REVOKED
            );
        }

        if ($token->isExpired()) {
            return DeviceTokenValidationResult::failure(
                DeviceTokenValidationResult::ERROR_EXPIRED
            );
        }

        // Update last_used_at
        $token->forceFill(['last_used_at' => now()])->save();

        return DeviceTokenValidationResult::success(
            deviceId: $token->device_id,
            tokenId: $token->id,
        );
    }
}
