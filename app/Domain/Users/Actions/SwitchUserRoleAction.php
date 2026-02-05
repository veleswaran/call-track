<?php

declare(strict_types=1);

namespace App\Domain\Users\Actions;

use App\Domain\Users\DTOs\SwitchUserRoleDTO;
use App\Domain\Users\Models\User;
use Illuminate\Validation\ValidationException;

class SwitchUserRoleAction
{
    public function handle(SwitchUserRoleDTO $dto): void
    {
        $user = User::findOrFail($dto->targetUserId);

        // Domain Rule: Super Admins cannot be modified by anyone via this action
        // (Double safety net, primary check is in Policy)
        if ($user->hasRole('super-admin')) {
            throw ValidationException::withMessages([
                'role' => ['Cannot change the role of a Super Admin.'],
            ]);
        }

        $user->syncRoles([$dto->newRole]);
    }
}
