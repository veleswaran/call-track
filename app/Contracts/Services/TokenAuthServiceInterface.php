<?php

declare(strict_types=1);

namespace App\Contracts\Services;

interface TokenAuthServiceInterface
{
    /**
     * Attempt token-based login for admin integration.
     *
     * @param  array{email: string, password: string, token_name?: string, two_factor_code?: string}  $credentials
     * @return array{token: string, token_type: string, user: \App\Domain\Users\Models\User}
     */
    public function attemptTokenLogin(array $credentials): array;

    /**
     * Revoke the currently authenticated personal access token.
     */
    public function revokeCurrentToken(\App\Domain\Users\Models\User $user): void;
}
