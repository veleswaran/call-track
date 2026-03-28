<?php

declare(strict_types=1);

namespace App\Domain\Teams\DTOs;

readonly class UpdateTeamMemberRoleDTO
{
    public function __construct(
        public int $teamId,
        public int $agentId,
        public string $role,
    ) {}
}
