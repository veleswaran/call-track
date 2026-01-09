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

    public function getAllTeams(): Collection
    {
        return Team::with('members')->get();
    }
}
