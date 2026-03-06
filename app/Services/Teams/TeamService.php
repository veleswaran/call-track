<?php

declare(strict_types=1);

namespace App\Services\Teams;

use App\Contracts\Services\TeamServiceInterface;
use App\Domain\Agents\Models\Agent;
use App\Domain\Teams\Actions\AddAgentToTeamAction;
use App\Domain\Teams\Actions\AssignTeamManagerAction;
use App\Domain\Teams\Actions\CreateTeamAction;
use App\Domain\Teams\Actions\DeleteTeamAction;
use App\Domain\Teams\Actions\GetTeamWithDetailsAction;
use App\Domain\Teams\Actions\ListTeamsAction;
use App\Domain\Teams\Actions\RemoveMemberFromTeamAction;
use App\Domain\Teams\Actions\UpdateMemberRoleAction;
use App\Domain\Teams\Actions\UpdateTeamAction;
use App\Domain\Teams\DTOs\AddTeamMemberDTO;
use App\Domain\Teams\DTOs\UpdateTeamMemberRoleDTO;
use App\Domain\Teams\Models\Team;
use Illuminate\Database\Eloquent\Collection;

class TeamService implements TeamServiceInterface
{
    public function __construct(
        protected CreateTeamAction $createTeamAction,
        protected AddAgentToTeamAction $addAgentToTeamAction,
        protected AssignTeamManagerAction $assignTeamManagerAction,
        protected RemoveMemberFromTeamAction $removeMemberFromTeamAction,
        protected UpdateMemberRoleAction $updateMemberRoleAction,

        protected ListTeamsAction $listTeamsAction,
        protected GetTeamWithDetailsAction $getTeamWithDetailsAction,
        protected UpdateTeamAction $updateTeamAction,
        protected DeleteTeamAction $deleteTeamAction
    ) {}

    public function createTeam(string $name): Team
    {
        return $this->createTeamAction->execute($name);
    }

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

    public function updateTeam(Team $team, string $name): Team
    {
        return $this->updateTeamAction->execute($team, $name);
    }

    public function deleteTeam(Team $team): void
    {
        $this->deleteTeamAction->execute($team);
    }

    public function getAllTeams(?\App\Domain\Users\Models\User $user = null): Collection
    {
        return $this->listTeamsAction->execute($user);
    }

    public function getPaginatedTeams(?\App\Domain\Users\Models\User $user = null, int $perPage = 20): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = Team::withCount([
            'members',
            'members as managers_count' => function ($query) {
                $query->where('team_members.role', 'MANAGER');
            },
        ]);

        if ($user && ! $user->hasRole(['super-admin', 'admin'])) {
            if ($user->agent) {
                /** @var \App\Domain\Agents\Models\Agent $agent */
                $agent = $user->agent;
                $query->whereHas('members', function ($q) use ($agent) {
                    $q->where('agents.id', $agent->id)
                        ->where('team_members.role', 'MANAGER');
                });
            } else {
                // If it's empty, we still return a paginator, but empty
                return Team::whereRaw('1=0')->paginate($perPage);
            }
        }

        return $query->paginate($perPage);
    }

    public function getTeamWithDetails(int $id): Team
    {
        return $this->getTeamWithDetailsAction->execute($id);
    }

    public function findTeam(int $id): Team
    {
        return Team::findOrFail($id);
    }
}
