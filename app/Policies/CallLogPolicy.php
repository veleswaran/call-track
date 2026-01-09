<?php

namespace App\Policies;

use App\Domain\Calls\Models\CallLog;
use App\Domain\Users\Models\User;

class CallLogPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        // Access is scoped by the query builder, so we allow any authenticated user
        // to attempt to view the list. The query will return empty or scoped results.
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, CallLog $callLog): bool
    {
        if ($user->hasRole(['super-admin', 'admin'])) {
            return true;
        }

        /** @var \App\Domain\Agents\Models\Agent|null $userAgent */
        $userAgent = $user->agent;

        if (! $userAgent) {
            return false;
        }

        // Get the agent who owns the device that created this log
        // Note: CallLogs belong to Devices, Devices belong to Agents.
        /** @var \App\Domain\Devices\Models\Device|null $device */
        $device = $callLog->device;
        /** @var \App\Domain\Agents\Models\Agent|null $logAgent */
        $logAgent = $device?->agent;

        if (! $logAgent) {
            return false;
        }

        // Owner check
        if ($userAgent->id === $logAgent->id) {
            return true;
        }

        // Manager check: Is user a manager of any team the log's agent belongs to?
        return $userAgent->teams()
            ->wherePivot('role', 'MANAGER')
            ->whereHas('members', function ($query) use ($logAgent) {
                // Explicitly use table alias if needed, or simple where
                $query->where('agents.id', $logAgent->id);
            })
            ->exists();
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // Call logs are created via API ingestion, usually by device token, not user auth
        // If an admin wants to manually create one, allow it.
        return $user->hasRole(['super-admin', 'admin']);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, CallLog $callLog): bool
    {
        return $user->hasRole(['super-admin', 'admin']);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, CallLog $callLog): bool
    {
        return $user->hasRole(['super-admin', 'admin']);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, CallLog $callLog): bool
    {
        return $user->hasRole(['super-admin', 'admin']);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, CallLog $callLog): bool
    {
        return $user->hasRole(['super-admin', 'admin']);
    }
}
