<?php

declare(strict_types=1);

namespace App\Actions\Devices;

use App\Domain\Devices\DTOs\IssueDeviceTokenDTO;
use App\Domain\Devices\Models\DeviceToken;
use Illuminate\Support\Str;

/**
 * Issues a new device token with proper lifecycle fields.
 * Returns plain text token (only returned once, never stored).
 */
class IssueDeviceTokenAction
{
    /**
     * Issue a new token for the device.
     *
     * @return array{token: DeviceToken, plainTextToken: string}
     */
    public function execute(IssueDeviceTokenDTO $dto): array
    {
        $plainTextToken = Str::random(60);

        $expiresAt = $dto->expiresInDays !== null
            ? now()->addDays($dto->expiresInDays)
            : null;

        $token = DeviceToken::create([
            'device_id' => $dto->deviceId,
            'token_hash' => hash('sha256', $plainTextToken),
            'device_name' => $dto->deviceName,
            'issued_at' => now(),
            'expires_at' => $expiresAt,
            'revoked_at' => null,
            'last_used_at' => null,
        ]);

        return [
            'token' => $token,
            'plainTextToken' => $plainTextToken,
        ];
    }
}
