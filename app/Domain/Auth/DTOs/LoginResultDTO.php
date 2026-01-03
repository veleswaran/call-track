<?php

declare(strict_types=1);

namespace App\Domain\Auth\DTOs;

use App\Domain\Users\Models\User;

readonly class LoginResultDTO
{
    public function __construct(
        public bool $success,
        public bool $requiresTwoFactor = false,
        public ?User $user = null,
    ) {}
}
