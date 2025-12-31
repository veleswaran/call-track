<?php

declare(strict_types=1);

namespace App\Domain\Users\Actions;

use App\Domain\Users\Models\User;

class DeleteUserAction
{
    public function execute(int $userId): void
    {
        $user = User::findOrFail($userId);
        $user->delete();
    }
}
