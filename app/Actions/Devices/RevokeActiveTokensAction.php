<?php

declare(strict_types=1);

namespace App\Actions\Devices;

use App\Domain\Devices\DTOs\RevokeTokensDTO;
use App\Domain\Devices\Models\DeviceToken;

/**
 * Revokes all active tokens for a device.
 * Tokens are NOT deleted - maintains audit trail.
 */
class RevokeActiveTokensAction
{
    /**
     * Revoke all active tokens for the given device.
     *
     * @return int Number of tokens revoked
     */
    public function execute(RevokeTokensDTO $dto): int
    {
        return DeviceToken::where('device_id', $dto->deviceId)
            ->active()
            ->update(['revoked_at' => now()]);
    }
}
