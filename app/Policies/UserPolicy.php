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

    /**
     * Determine whether the user can reset the target user's password.
     */
    public function resetPassword(User $user, User $targetUser): bool
    {
        return $user->hasRole('super-admin');
    }

    /**
     * Determine if the authenticated user can change the target user's role.
     */
    public function updateRole(User $user, User $targetUser, string $newRole): bool
    {
        // 1. Super Admin cannot be changed by anyone (handled in Action too, but redundant safety here)
        if ($targetUser->hasRole('super-admin')) {
            return false;
        }

        // 2. Super Admin can change anyone else
        if ($user->hasRole('super-admin')) {
            return true;
        }

        // 3. Admin logic
        if ($user->hasRole('admin')) {
            // Admin cannot switch other Admins or Super Admins
            if ($targetUser->hasRole(['admin', 'super-admin'])) {
                return false;
            }

            // Admin can only switch TO allowed roles (Manager, Member)
            // Assuming 'manager' and 'member' are the allowed roles for Admin to assign.
            // If newRole is ADMIN or SUPER_ADMIN, deny.
            if (in_array($newRole, ['admin', 'super-admin'])) {
                return false;
            }

            return true;
        }

        // 4. Everyone else -> Deny
        return false;
    }
}
