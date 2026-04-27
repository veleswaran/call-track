<?php

declare(strict_types=1);

namespace App\Services\Auth;

use App\Contracts\Services\TokenAuthServiceInterface;
use App\Domain\Users\Models\User;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use PragmaRX\Google2FA\Google2FA;

class TokenAuthService implements TokenAuthServiceInterface
{
    public function __construct(
        private Google2FA $google2fa
    ) {}

    public function attemptTokenLogin(array $credentials): array
    {
        $user = User::query()->where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        if (! $user->hasRole(['super-admin', 'admin'])) {
            throw ValidationException::withMessages([
                'email' => ['This account does not have admin API access.'],
            ]);
        }

        if ($user->two_factor_secret) {
            $this->validateTwoFactorCode($user, $credentials['two_factor_code'] ?? null);
        }

        $tokenName = $credentials['token_name'] ?? 'external-admin-integration';
        $plainTextToken = $user->createToken($tokenName, ['admin'])->plainTextToken;

        return [
            'token' => $plainTextToken,
            'token_type' => 'Bearer',
            'user' => $user,
        ];
    }

    public function revokeCurrentToken(User $user): void
    {
        $user->currentAccessToken()->delete();
    }

    private function validateTwoFactorCode(User $user, ?string $twoFactorCode): void
    {
        if (! $twoFactorCode) {
            throw ValidationException::withMessages([
                'two_factor_code' => ['Two factor code is required for this account.'],
            ]);
        }

        $secret = Crypt::decryptString($user->two_factor_secret);
        $isValid = $this->google2fa->verifyKey($secret, $twoFactorCode);

        if (! $isValid) {
            throw ValidationException::withMessages([
                'two_factor_code' => ['The provided two factor authentication code was invalid.'],
            ]);
        }
    }
}
