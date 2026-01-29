<?php

namespace App\Policies;

use App\Domain\Teams\Models\Team;
use App\Domain\Users\Models\User;

class TeamPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasRole(['super-admin', 'admin']) || $user->can('manage team');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Team $team): bool
    {
        if ($user->hasRole(['super-admin', 'admin'])) {
            return true;
        }

        /** @var \App\Domain\Agents\Models\Agent|null $agent */
        $agent = $user->agent;

        if (! $agent) {
            return false;
        }

        // Manager of the team
        return $agent->teams()
            ->where('teams.id', $team->id)
            ->wherePivot('role', 'MANAGER')
            ->exists();
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasRole(['super-admin', 'admin']);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Team $team): bool
    {
        return $user->hasRole(['super-admin', 'admin']);
    }

    /**
     * Determine whether the user can delete the model.
     */
    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Team $team): bool
    {
        return $user->hasRole('super-admin');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Team $team): bool
    {
        return $user->hasRole('super-admin');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Team $team): bool
    {
        return $user->hasRole('super-admin');
    }
}
