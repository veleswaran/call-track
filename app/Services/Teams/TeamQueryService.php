<?php

declare(strict_types=1);

namespace App\Services\Teams;

use App\Contracts\Services\Teams\TeamQueryServiceInterface;
use App\Domain\Teams\Actions\GetTeamWithDetailsAction;
use App\Domain\Teams\Actions\ListPaginatedTeamsAction;
use App\Domain\Teams\Actions\ListTeamsAction;
use App\Domain\Teams\Models\Team;
use App\Domain\Users\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

final class TeamQueryService implements TeamQueryServiceInterface
{
    public function __construct(
        private readonly ListTeamsAction $listTeamsAction,
        private readonly ListPaginatedTeamsAction $listPaginatedTeamsAction,
        private readonly GetTeamWithDetailsAction $getTeamWithDetailsAction,
    ) {}

    public function getAllTeams(?User $user = null): Collection
    {
        return $this->listTeamsAction->execute($user);
    }

    public function getPaginatedTeams(?User $user = null, int $perPage = 20, ?string $search = null): LengthAwarePaginator
    {
        return $this->listPaginatedTeamsAction->execute($user, $perPage, $search);
    }

    public function getTeamWithDetails(int $id): Team
    {
        return $this->getTeamWithDetailsAction->execute($id);
    }
}
