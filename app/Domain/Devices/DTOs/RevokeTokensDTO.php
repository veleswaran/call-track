<?php

declare(strict_types=1);

namespace App\Domain\Devices\DTOs;

/**
 * DTO for revoking device tokens.
 */
readonly class RevokeTokensDTO
{
    public function __construct(
        public int $deviceId,
        public string $reason = 'rotation',
    ) {}
}
