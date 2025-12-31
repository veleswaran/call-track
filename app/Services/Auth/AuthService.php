<?php

declare(strict_types=1);

namespace App\Services\Auth;

use App\Contracts\Services\AuthServiceInterface;
use App\Domain\Auth\DTOs\LoginResultDTO;
use Illuminate\Support\Facades\Auth;

class AuthService implements AuthServiceInterface
{
    public function attemptLogin(array $credentials): LoginResultDTO
    {
        if (! Auth::guard('web')->attempt($credentials)) {
            return new LoginResultDTO(success: false);
        }

        $user = Auth::guard('web')->user();

        if ($user->two_factor_secret) {
            Auth::guard('web')->logout();
            session()->put('auth.2fa.id', $user->id);

            return new LoginResultDTO(success: true, requiresTwoFactor: true);
        }

        session()->regenerate();

        return new LoginResultDTO(success: true, requiresTwoFactor: false, user: $user);
    }

    public function logout(): void
    {
        Auth::guard('web')->logout();
        session()->invalidate();
        session()->regenerateToken();
    }
}
