<?php

declare(strict_types=1);

namespace App\Domain\Users\DTOs;

readonly class UnlinkUserFromAgentDTO
{
    public function __construct(
        public int $userId,
        public int $agentId,
    ) {}

    public function toArray(): array
    {
        return [
            'user_id' => $this->userId,
            'agent_id' => $this->agentId,
        ];
    }
}
