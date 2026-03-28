<?php

declare(strict_types=1);

namespace App\Domain\Teams\DTOs;

readonly class RemoveTeamMemberDTO
{
    public function __construct(
        public int $teamId,
        public int $agentId,
    ) {}
}
