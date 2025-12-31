<?php

declare(strict_types=1);

namespace App\Policies;

use App\Domain\Users\Models\User;

class UserPolicy
{
    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $authUser, User $model): bool
    {
        // Prevent self-deletion
        return $authUser->id !== $model->id;
    }
}
