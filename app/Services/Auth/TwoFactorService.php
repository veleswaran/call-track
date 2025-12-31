<?php

declare(strict_types=1);

namespace App\Services\Auth;

use App\Domain\Users\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Crypt;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorService
{
    protected Google2FA $google2fa;

    public function __construct()
    {
        $this->google2fa = new Google2FA;
    }

    public function generateSecretKey(): string
    {
        return $this->google2fa->generateSecretKey();
    }

    public function getQrCodeUrl(User $user, string $secret): string
    {
        return $this->google2fa->getQRCodeUrl(
            config('app.name'),
            $user->email,
            $secret
        );
    }

    public function verify(string $secret, string $code): bool
    {
        return $this->google2fa->verifyKey($secret, $code);
    }

    public function enable(User $user, string $secret): array
    {
        $recoveryCodes = Collection::times(8, fn () => \Illuminate\Support\Str::random(10).'-'.\Illuminate\Support\Str::random(10))->all();

        $user->forceFill([
            'two_factor_secret' => Crypt::encryptString($secret),
            'two_factor_recovery_codes' => Crypt::encryptString(json_encode($recoveryCodes)),
            'two_factor_confirmed_at' => now(),
        ])->save();

        return $recoveryCodes;
    }

    public function disable(User $user): void
    {
        $user->forceFill([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ])->save();
    }

    public function generateRecoveryCodes(User $user): array
    {
        $recoveryCodes = Collection::times(8, fn () => \Illuminate\Support\Str::random(10).'-'.\Illuminate\Support\Str::random(10))->all();

        $user->forceFill([
            'two_factor_recovery_codes' => Crypt::encryptString(json_encode($recoveryCodes)),
        ])->save();

        return $recoveryCodes;
    }
}
