<?php

declare(strict_types=1);

namespace App\Domain\Users\Actions;

use App\Actions\Auth\UpdateUserPasswordAction;
use App\Domain\Users\Models\User;

class ResetUserPasswordAction
{
    public function __construct(
        protected UpdateUserPasswordAction $updateUserPasswordAction
    ) {}

    public function execute(int $userId, string $newPassword): void
    {
        $user = User::findOrFail($userId);
        $this->updateUserPasswordAction->execute($user, $newPassword);
    }
}
