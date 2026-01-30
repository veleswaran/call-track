<?php

namespace App\Policies;

use App\Domain\Agents\Models\Agent;
use App\Domain\Users\Models\User;

class AgentPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasRole(['super-admin', 'admin', 'manager']);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Agent $agent): bool
    {
        if ($user->hasRole(['super-admin', 'admin'])) {
            return true;
        }

        /** @var \App\Domain\Agents\Models\Agent|null $userAgent */
        $userAgent = $user->agent;

        if ($userAgent && $userAgent->id === $agent->id) {
            return true;
        }

        if (! $userAgent) {
            return false;
        }

        // Check if user is a manager of any team this agent belongs to
        return $userAgent->teams()
            ->wherePivot('role', 'MANAGER')
            ->whereHas('members', function ($query) use ($agent) {
                $query->where('agents.id', $agent->id);
            })
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
    public function update(User $user, Agent $agent): bool
    {
        return $user->hasRole(['super-admin', 'admin']);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Agent $agent): bool
    {
        return $user->hasRole(['super-admin', 'admin']);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Agent $agent): bool
    {
        return $user->hasRole(['super-admin', 'admin']);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Agent $agent): bool
    {
        return $user->hasRole(['super-admin', 'admin']);
    }
}
