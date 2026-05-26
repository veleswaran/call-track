<?php

declare(strict_types=1);

namespace App\Domain\Devices\DTOs;

/**
 * DTO for issuing a new device token.
 */
readonly class IssueDeviceTokenDTO
{
    public function __construct(
        public int $deviceId,
        public string $deviceName,
        public ?int $expiresInDays = null,
    ) {}
}
