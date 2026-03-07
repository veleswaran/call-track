<?php

declare(strict_types=1);

namespace App\Contracts\Services\Teams;

use App\Domain\Agents\Models\Agent;
use App\Domain\Teams\DTOs\AddTeamMemberDTO;
use App\Domain\Teams\DTOs\UpdateTeamMemberRoleDTO;
use App\Domain\Teams\Models\Team;

interface TeamMemberServiceInterface
{
    public function addMember(Team $team, AddTeamMemberDTO $dto): void;

    public function addAgent(Team $team, Agent $agent): void;

    public function assignManager(Team $team, Agent $agent): void;

    public function removeMember(Team $team, int $agentId): void;

    public function updateMemberRole(Team $team, UpdateTeamMemberRoleDTO $dto): void;
}
