<?php

declare(strict_types=1);

namespace App\Services\Teams;

use App\Contracts\Services\Teams\TeamMemberServiceInterface;
use App\Domain\Agents\Models\Agent;
use App\Domain\Teams\Actions\AddAgentToTeamAction;
use App\Domain\Teams\Actions\AssignTeamManagerAction;
use App\Domain\Teams\Actions\RemoveMemberFromTeamAction;
use App\Domain\Teams\Actions\UpdateMemberRoleAction;
use App\Domain\Teams\DTOs\AddTeamMemberDTO;
use App\Domain\Teams\DTOs\UpdateTeamMemberRoleDTO;
use App\Domain\Teams\Models\Team;

final class TeamMemberService implements TeamMemberServiceInterface
{
    public function __construct(
        private readonly AddAgentToTeamAction $addAgentToTeamAction,
        private readonly AssignTeamManagerAction $assignTeamManagerAction,
        private readonly RemoveMemberFromTeamAction $removeMemberFromTeamAction,
        private readonly UpdateMemberRoleAction $updateMemberRoleAction,
    ) {}

    public function addMember(Team $team, AddTeamMemberDTO $dto): void
    {
        $agent = Agent::findOrFail($dto->agentId);

        if ($dto->role === 'MANAGER') {
            $this->assignManager($team, $agent);
        } else {
            $this->addAgent($team, $agent);
        }
    }

    public function addAgent(Team $team, Agent $agent): void
    {
        $this->addAgentToTeamAction->execute($team, $agent);
    }

    public function assignManager(Team $team, Agent $agent): void
    {
        $this->assignTeamManagerAction->execute($team, $agent);
    }

    public function removeMember(Team $team, int $agentId): void
    {
        $agent = Agent::findOrFail($agentId);
        $this->removeMemberFromTeamAction->execute($team, $agent);
    }

    public function updateMemberRole(Team $team, UpdateTeamMemberRoleDTO $dto): void
    {
        $agent = Agent::findOrFail($dto->agentId);
        $this->updateMemberRoleAction->execute($team, $agent, $dto->role);
    }
}
