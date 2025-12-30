<?php

declare(strict_types=1);

namespace App\Contracts\Services;

use App\Domain\Devices\DTOs\DeviceTokenValidationResult;
use App\Domain\Devices\DTOs\IssueDeviceTokenDTO;

interface DeviceTokenServiceInterface
{
    public function validateToken(string $token): DeviceTokenValidationResult;

    public function revokeAllActiveTokens(int $deviceId): int;

    public function issueToken(IssueDeviceTokenDTO $dto): string;
}
