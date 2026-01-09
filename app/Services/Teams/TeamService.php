<?php

declare(strict_types=1);

namespace App\Services\Teams;

use App\Contracts\Services\TeamServiceInterface;
use App\Domain\Agents\Models\Agent;
use App\Domain\Teams\Actions\AddAgentToTeamAction;
use App\Domain\Teams\Actions\AssignTeamManagerAction;
use App\Domain\Teams\Actions\CreateTeamAction;
use App\Domain\Teams\Models\Team;
use Illuminate\Database\Eloquent\Collection;

class TeamService implements TeamServiceInterface
{
    public function __construct(
        protected CreateTeamAction $createTeamAction,
        protected AddAgentToTeamAction $addAgentToTeamAction,
        protected AssignTeamManagerAction $assignTeamManagerAction
    ) {}

    public function createTeam(string $name): Team
    {
        return $this->createTeamAction->execute($name);
    }

    public function addAgent(Team $team, Agent $agent): void
    {
        $this->addAgentToTeamAction->execute($team, $agent);
    }

    public function assignManager(Team $team, Agent $agent): void
    {
        $this->assignTeamManagerAction->execute($team, $agent);
    }

    public function removeMember(Team $team, Agent $agent): void
    {
        $team->members()->detach($agent->id);
    }

    public function updateMemberRole(Team $team, Agent $agent, string $role): void
    {
        $team->members()->updateExistingPivot($agent->id, ['role' => $role]);
    }

    public function getAllTeams(): Collection
    {
        return Team::withCount([
            'members',
            'members as managers_count' => function ($query) {
                $query->where('team_members.role', 'MANAGER');
            },
        ])->get();
    }
}
