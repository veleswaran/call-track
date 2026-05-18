<?php

declare(strict_types=1);

namespace App\Contracts\Services;

use App\Domain\Auth\DTOs\AdminTokenLoginDTO;
use App\Domain\Auth\DTOs\AdminTokenLoginResultDTO;

interface TokenAuthServiceInterface
{
    /**
     * Attempt token-based login for admin integration.
     */
    public function attemptTokenLogin(AdminTokenLoginDTO $dto): AdminTokenLoginResultDTO;

    /**
     * Revoke the currently authenticated personal access token.
     */
    public function revokeCurrentToken(): void;
}
