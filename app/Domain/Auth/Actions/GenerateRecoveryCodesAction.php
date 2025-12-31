<?php

declare(strict_types=1);

namespace App\Domain\Auth\Actions;

use App\Domain\Users\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;

class GenerateRecoveryCodesAction
{
    /**
     * @return string[]
     */
    public function execute(User $user): array
    {
        $recoveryCodes = Collection::times(8, fn () => Str::random(10).'-'.Str::random(10))->all();

        $user->forceFill([
            'two_factor_recovery_codes' => Crypt::encryptString(json_encode($recoveryCodes)),
        ])->save();

        return $recoveryCodes;
    }
}
