<?php

declare(strict_types=1);

namespace App\Contracts\Services;

use App\Domain\Agents\Models\Agent;
use App\Domain\Teams\DTOs\AddTeamMemberDTO;
use App\Domain\Teams\DTOs\RemoveTeamMemberDTO;
use App\Domain\Teams\DTOs\UpdateTeamMemberRoleDTO;
use App\Domain\Teams\Models\Team;
use Illuminate\Database\Eloquent\Collection;

interface TeamServiceInterface
{
    public function createTeam(string $name): Team;

    public function addMember(AddTeamMemberDTO $dto): void;

    public function addAgent(Team $team, Agent $agent): void;

    public function assignManager(Team $team, Agent $agent): void;

    public function removeMember(RemoveTeamMemberDTO $dto): void;

    public function updateMemberRole(UpdateTeamMemberRoleDTO $dto): void;

    public function getAllTeams(): Collection;

    public function getTeamWithDetails(int $id): Team;

    public function findTeam(int $id): Team;
}
