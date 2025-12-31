<?php

declare(strict_types=1);

namespace App\Domain\Devices\DTOs;

readonly class GenerateDeviceCodeDTO
{
    public function __construct(
        public int $agentId,
        public int $expiresInHours = 24,
    ) {}
}
