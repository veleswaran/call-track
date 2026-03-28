<?php

declare(strict_types=1);

namespace App\Services\Users;

use App\Contracts\Services\Users\UserRoleServiceInterface;
use App\Domain\Users\Actions\SwitchUserRoleAction;
use App\Domain\Users\DTOs\SwitchUserRoleDTO;
use App\Domain\Users\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\Gate;

class UserRoleService implements UserRoleServiceInterface
{
    public function __construct(
        protected SwitchUserRoleAction $switchUserRoleAction
    ) {}

    public function switchRole(User $actor, SwitchUserRoleDTO $dto): void
    {
        $targetUser = User::findOrFail($dto->targetUserId);

        // Authorization Check
        if (! Gate::forUser($actor)->allows('updateRole', [$targetUser, $dto->newRole])) {
            throw new AuthorizationException('You are not authorized to change this user\'s role.');
        }

        $this->switchUserRoleAction->handle($dto);
    }
}
