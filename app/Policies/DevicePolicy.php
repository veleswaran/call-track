<?php

namespace App\Policies;

use App\Domain\Devices\Models\Device;
use App\Domain\Users\Models\User;

class DevicePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true; // Filtering handled by Service
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Device $device): bool
    {
        if ($user->hasRole(['super-admin', 'admin'])) {
            return true;
        }

        /** @var \App\Domain\Agents\Models\Agent|null $userAgent */
        $userAgent = $user->agent;

        if (! $userAgent) {
            return false;
        }

        // Owner check: Device belongs to User's Agent
        if ($device->agent_id === $userAgent->id) {
            return true;
        }

        // Manager check: User manages the team the Device's Agent belongs to
        return $user->managedTeams()
            ->whereHas('members', function ($query) use ($device) {
                $query->where('agents.id', $device->agent_id);
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
    public function update(User $user, Device $device): bool
    {
        return $user->hasRole(['super-admin', 'admin']);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Device $device): bool
    {
        return $user->hasRole('super-admin');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Device $device): bool
    {
        return $user->hasRole('super-admin');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Device $device): bool
    {
        return $user->hasRole('super-admin');
    }
}
