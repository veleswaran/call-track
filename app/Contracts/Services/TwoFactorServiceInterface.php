<?php

declare(strict_types=1);

namespace App\Contracts\Services;

use App\Domain\Auth\DTOs\TwoFactorChallengeDTO;
use App\Domain\Users\Models\User;

interface TwoFactorServiceInterface
{
    public function generateSecretKey(): string;

    public function getQrCodeUrl(User $user, string $secret): string;

    public function verify(string $secret, string $code): bool;

    /**
     * @return string[]
     */
    public function enable(User $user, string $secret): array;

    public function disable(User $user): void;

    /**
     * @return string[]
     */
    public function generateRecoveryCodes(User $user): array;

    /**
     * Handle the 2FA challenge workflow.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function handleChallenge(TwoFactorChallengeDTO $dto): User;
}
