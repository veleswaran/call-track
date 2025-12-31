<?php

declare(strict_types=1);

namespace App\Domain\Auth\DTOs;

readonly class TwoFactorChallengeDTO
{
    public function __construct(
        public string $code,
        public ?int $userId = null,
    ) {}
}
