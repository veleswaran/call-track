<?php

declare(strict_types=1);

namespace App\Domain\Users\DTOs;

readonly class CreateAdminUserDTO
{
    public function __construct(
        public string $name,
        public string $email,
        public string $password,
    ) {}
}
