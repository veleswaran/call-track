<?php

declare(strict_types=1);

namespace App\Contracts\Services;

use App\Domain\Agents\Models\Agent;
use App\Domain\Teams\DTOs\AddTeamMemberDTO;
use App\Domain\Teams\DTOs\UpdateTeamMemberRoleDTO;
use App\Domain\Teams\Models\Team;
use Illuminate\Database\Eloquent\Collection;

interface TeamServiceInterface
{
    public function createTeam(string $name): Team;

    public function addMember(Team $team, AddTeamMemberDTO $dto): void;

    public function addAgent(Team $team, Agent $agent): void;

    public function assignManager(Team $team, Agent $agent): void;

    public function removeMember(Team $team, int $agentId): void;

    public function updateMemberRole(Team $team, UpdateTeamMemberRoleDTO $dto): void;

    public function getAllTeams(?\App\Domain\Users\Models\User $user = null): Collection;

    public function getPaginatedTeams(?\App\Domain\Users\Models\User $user = null, int $perPage = 20): \Illuminate\Contracts\Pagination\LengthAwarePaginator;

    public function updateTeam(Team $team, string $name): Team;

    public function getTeamWithDetails(int $id): Team;

    public function findTeam(int $id): Team;
}
