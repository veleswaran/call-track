<?php

declare(strict_types=1);

namespace App\Domain\Teams\Actions;

use App\Domain\Teams\Models\Team;
use App\Domain\Users\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ListPaginatedTeamsAction
{
    /**
     * List teams with pagination and RBAC scoping
     */
    public function execute(?User $user = null, int $perPage = 20): LengthAwarePaginator
    {
        $query = Team::withCount([
            'members',
            'members as managers_count' => function ($query) {
                $query->where('team_members.role', 'MANAGER');
            },
        ]);

        // Scoping: If user is provided and NOT an admin, filter by manager role
        if ($user && ! $user->hasRole(['super-admin', 'admin'])) {
            if ($user->agent) {
                /** @var \App\Domain\Agents\Models\Agent $agent */
                $agent = $user->agent;
                $query->whereHas('members', function ($q) use ($agent) {
                    $q->where('agents.id', $agent->id)
                        ->where('team_members.role', 'MANAGER');
                });
            } else {
                // If it's an agent-less non-admin, return empty paginator
                return Team::whereRaw('1=0')->paginate($perPage);
            }
        }

        return $query->paginate($perPage);
    }
}
