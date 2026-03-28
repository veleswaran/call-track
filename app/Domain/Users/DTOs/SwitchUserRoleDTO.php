<?php

declare(strict_types=1);

namespace App\Domain\Users\DTOs;

readonly class SwitchUserRoleDTO
{
    public function __construct(
        public int $targetUserId,
        public string $newRole
    ) {}
}
