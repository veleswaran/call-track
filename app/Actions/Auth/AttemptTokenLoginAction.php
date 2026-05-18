<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Domain\Auth\DTOs\AdminTokenLoginDTO;
use App\Domain\Auth\DTOs\AdminTokenLoginResultDTO;
use App\Domain\Users\Models\User;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use PragmaRX\Google2FA\Google2FA;

class AttemptTokenLoginAction
{
    public function __construct(
        private Google2FA $google2fa
    ) {}

    public function execute(AdminTokenLoginDTO $dto): AdminTokenLoginResultDTO
    {
        $user = User::query()->where('email', $dto->email)->first();

        if (! $user || ! Hash::check($dto->password, $user->password)) {
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
            $this->validateTwoFactorCode($user, $dto->twoFactorCode);
        }

        $tokenName = $dto->tokenName ?? 'external-admin-integration';
        $plainTextToken = $user->createToken($tokenName, ['admin'])->plainTextToken;

        return new AdminTokenLoginResultDTO(
            token: $plainTextToken,
            tokenType: 'Bearer',
            user: $user,
        );
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
