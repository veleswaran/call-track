<?php

declare(strict_types=1);

namespace App\Contracts\Services\Users;

use App\Domain\Users\DTOs\SwitchUserRoleDTO;
use App\Domain\Users\Models\User;

interface UserRoleServiceInterface
{
    /**
     * Switch a user's role.
     *
     * @param  User  $actor  The user performing the action.
     */
    public function switchRole(User $actor, SwitchUserRoleDTO $dto): void;
}
