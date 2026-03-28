<?php

declare(strict_types=1);

namespace App\Domain\Teams\Actions;

use App\Domain\Teams\Models\Team;
use Illuminate\Database\Eloquent\Collection;

class ListTeamsAction
{
    public function execute(?\App\Domain\Users\Models\User $user = null): Collection
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
                // No agent = No teams managed
                return new Collection;
            }
        }

        return $query->get();
    }
}
