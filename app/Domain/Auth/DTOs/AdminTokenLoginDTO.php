<?php

declare(strict_types=1);

namespace App\Domain\Auth\DTOs;

final class AdminTokenLoginDTO
{
    public function __construct(
        public readonly string $email,
        public readonly string $password,
        public readonly ?string $tokenName = null,
        public readonly ?string $twoFactorCode = null,
    ) {}
}
