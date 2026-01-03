<?php

declare(strict_types=1);

namespace App\Domain\Auth\Actions;

use App\Domain\Users\Models\User;

class DisableTwoFactorAction
{
    public function execute(User $user): void
    {
        $user->forceFill([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ])->save();
    }
}
