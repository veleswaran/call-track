<?php

declare(strict_types=1);

namespace App\Services\Teams;

use App\Contracts\Services\Teams\TeamManagementServiceInterface;
use App\Domain\Teams\Actions\CreateTeamAction;
use App\Domain\Teams\Actions\DeleteTeamAction;
use App\Domain\Teams\Actions\UpdateTeamAction;
use App\Domain\Teams\Models\Team;

final class TeamManagementService implements TeamManagementServiceInterface
{
    public function __construct(
        private readonly CreateTeamAction $createTeamAction,
        private readonly UpdateTeamAction $updateTeamAction,
        private readonly DeleteTeamAction $deleteTeamAction,
    ) {}

    public function createTeam(string $name): Team
    {
        return $this->createTeamAction->execute($name);
    }

    public function updateTeam(Team $team, string $name): Team
    {
        return $this->updateTeamAction->execute($team, $name);
    }

    public function deleteTeam(Team $team): void
    {
        $this->deleteTeamAction->execute($team);
    }

    public function findTeam(int $id): Team
    {
        return Team::findOrFail($id);
    }
}
