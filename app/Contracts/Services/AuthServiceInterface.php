<?php

declare(strict_types=1);

namespace App\Contracts\Services;

use App\Domain\Auth\DTOs\LoginResultDTO;

interface AuthServiceInterface
{
    /**
     * Attempt to login with credentials.
     */
    public function attemptLogin(array $credentials): LoginResultDTO;

    /**
     * Logout the current user.
     */
    public function logout(): void;
}
