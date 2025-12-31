<?php

declare(strict_types=1);

namespace App\Domain\Users\Actions;

use App\Domain\Auth\Actions\DisableTwoFactorAction;
use App\Domain\Users\Models\User;

class ResetTwoFactorAction
{
    public function __construct(
        protected DisableTwoFactorAction $disableTwoFactorAction
    ) {}

    public function execute(int $userId): void
    {
        $user = User::findOrFail($userId);
        $this->disableTwoFactorAction->execute($user);
    }
}
