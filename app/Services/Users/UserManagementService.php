<?php

declare(strict_types=1);

namespace App\Services\Users;

use App\Contracts\Services\UserManagementServiceInterface;
use App\Domain\Users\Actions\CreateAdminUserAction;
use App\Domain\Users\DTOs\CreateAdminUserDTO;
use App\Domain\Users\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

class UserManagementService implements UserManagementServiceInterface
{
    public function __construct(
        protected CreateAdminUserAction $createAdminUserAction,
        protected \App\Domain\Users\Actions\GetPaginatedUsersAction $getPaginatedUsersAction,
        protected \App\Domain\Users\Actions\DeleteUserAction $deleteUserAction,
        protected \App\Domain\Users\Actions\ResetTwoFactorAction $resetTwoFactorAction,
    ) {}

    public function getPaginatedUsers(int $perPage = 15): LengthAwarePaginator
    {
        return $this->getPaginatedUsersAction->execute($perPage);
    }

    public function createAdminUser(CreateAdminUserDTO $dto): User
    {
        return $this->createAdminUserAction->execute($dto);
    }

    public function deleteUser(int $userId): void
    {
        $this->deleteUserAction->execute($userId);
    }

    public function resetTwoFactor(int $userId): void
    {
        $this->resetTwoFactorAction->execute($userId);
    }
}
