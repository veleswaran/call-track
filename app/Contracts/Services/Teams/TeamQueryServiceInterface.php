<?php

declare(strict_types=1);

namespace App\Contracts\Services\Teams;

use App\Domain\Teams\Models\Team;
use App\Domain\Users\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface TeamQueryServiceInterface
{
    public function getAllTeams(?User $user = null): Collection;

    public function getPaginatedTeams(?User $user = null, int $perPage = 20): LengthAwarePaginator;

    public function getTeamWithDetails(int $id): Team;
}
