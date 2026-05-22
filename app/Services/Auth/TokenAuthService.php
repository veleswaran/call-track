<?php

declare(strict_types=1);

namespace App\Services\Auth;

use App\Actions\Auth\AttemptTokenLoginAction;
use App\Actions\Auth\RevokeCurrentTokenAction;
use App\Contracts\Services\TokenAuthServiceInterface;
use App\Domain\Auth\DTOs\AdminTokenLoginDTO;
use App\Domain\Auth\DTOs\AdminTokenLoginResultDTO;

class TokenAuthService implements TokenAuthServiceInterface
{
    public function __construct(
        private AttemptTokenLoginAction $attemptLoginAction,
        private RevokeCurrentTokenAction $revokeTokenAction
    ) {}

    public function attemptTokenLogin(AdminTokenLoginDTO $dto): AdminTokenLoginResultDTO
    {
        return $this->attemptLoginAction->execute($dto);
    }

    public function revokeCurrentToken(): void
    {
        $this->revokeTokenAction->execute();
    }
}
