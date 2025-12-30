<?php

declare(strict_types=1);

namespace App\Services\Devices;

use App\Actions\Devices\IssueDeviceTokenAction;
use App\Actions\Devices\RevokeActiveTokensAction;
use App\Actions\Devices\ValidateDeviceTokenAction;
use App\Contracts\Services\DeviceTokenServiceInterface;
use App\Domain\Devices\DTOs\DeviceTokenValidationResult;
use App\Domain\Devices\DTOs\IssueDeviceTokenDTO;
use App\Domain\Devices\DTOs\RevokeTokensDTO;

class DeviceTokenService implements DeviceTokenServiceInterface
{
    public function __construct(
        protected ValidateDeviceTokenAction $validateAction,
        protected RevokeActiveTokensAction $revokeAction,
        protected IssueDeviceTokenAction $issueAction,
    ) {}

    public function validateToken(string $token): DeviceTokenValidationResult
    {
        return $this->validateAction->execute($token);
    }

    public function revokeAllActiveTokens(int $deviceId): int
    {
        return $this->revokeAction->execute(new RevokeTokensDTO(
            deviceId: $deviceId,
            reason: 'manual_revocation'
        ));
    }

    public function issueToken(IssueDeviceTokenDTO $dto): string
    {
        $result = $this->issueAction->execute($dto);

        return $result['plainTextToken'];
    }
}
