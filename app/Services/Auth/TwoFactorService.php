<?php

declare(strict_types=1);

namespace App\Services\Auth;

use App\Domain\Users\Models\User;
use Illuminate\Support\Facades\Crypt;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorService implements \App\Contracts\Services\TwoFactorServiceInterface
{
    protected Google2FA $google2fa;

    public function __construct(
        protected \App\Domain\Auth\Actions\EnableTwoFactorAction $enableTwoFactorAction,
        protected \App\Domain\Auth\Actions\DisableTwoFactorAction $disableTwoFactorAction,
        protected \App\Domain\Auth\Actions\GenerateRecoveryCodesAction $generateRecoveryCodesAction,
        protected \App\Domain\Users\Actions\FindUserByIdAction $findUserByIdAction,
    ) {
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
        return $this->enableTwoFactorAction->execute($user, $secret);
    }

    public function disable(User $user): void
    {
        $this->disableTwoFactorAction->execute($user);
    }

    public function generateRecoveryCodes(User $user): array
    {
        return $this->generateRecoveryCodesAction->execute($user);
    }

    public function handleChallenge(\App\Domain\Auth\DTOs\TwoFactorChallengeDTO $dto): User
    {
        if (! $dto->userId) {
            throw new \Illuminate\Auth\AuthenticationException('Two factor authentication session expired.');
        }

        $user = $this->findUserByIdAction->execute($dto->userId);

        if (! $user) {
            session()->forget('auth.2fa.id');
            throw new \Illuminate\Auth\AuthenticationException('User not found.');
        }

        if (! $user->two_factor_secret) {
            throw new \Illuminate\Auth\AuthenticationException('Two factor authentication not enabled for this user.');
        }

        $valid = $this->verify(
            Crypt::decryptString($user->two_factor_secret),
            $dto->code
        );

        if (! $valid) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'code' => ['The provided two factor authentication code was invalid.'],
            ]);
        }

        \Illuminate\Support\Facades\Auth::guard('web')->login($user);
        session()->forget('auth.2fa.id');
        session()->regenerate();

        return $user;
    }
}
