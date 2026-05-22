<?php

declare(strict_types=1);

namespace App\Domain\Auth\DTOs;

use App\Domain\Users\Models\User;

final class AdminTokenLoginResultDTO
{
    public function __construct(
        public readonly string $token,
        public readonly string $tokenType,
        public readonly User $user,
    ) {}
}
