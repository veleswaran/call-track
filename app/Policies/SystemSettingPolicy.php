<?php

declare(strict_types=1);

namespace App\Policies;

use App\Domain\Users\Models\User;

class SystemSettingPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasRole(['super-admin', 'admin', 'manager']);
    }

    /**
     * Determine whether the user can update settings.
     */
    public function update(User $user): bool
    {
        return $user->hasRole(['super-admin', 'admin']);
    }
}
