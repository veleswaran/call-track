<?php

declare(strict_types=1);

namespace App\Contracts\Services\Teams;

use App\Domain\Teams\Models\Team;

interface TeamManagementServiceInterface
{
    public function createTeam(string $name): Team;

    public function updateTeam(Team $team, string $name): Team;

    public function deleteTeam(Team $team): void;

    public function findTeam(int $id): Team;
}
