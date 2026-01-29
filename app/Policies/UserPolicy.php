<?php

declare(strict_types=1);

namespace App\Policies;

use App\Domain\Users\Models\User;

class UserPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasRole(['super-admin', 'admin']);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, User $model): bool
    {
        if ($user->hasRole(['super-admin', 'admin'])) {
            return true;
        }

        // Members/Managers do not have access to Users module
        return false;
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
    public function update(User $user, User $model): bool
    {
        return $user->hasRole(['super-admin', 'admin']);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $authUser, User $model): bool
    {
        if ($authUser->id === $model->id) {
            return false;
        }

        return $authUser->hasRole(['super-admin', 'admin']);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, User $model): bool
    {
        return $user->hasRole('super-admin');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, User $model): bool
    {
        return $user->hasRole('super-admin');
    }
}
