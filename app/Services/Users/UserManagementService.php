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
    ) {}

    public function getPaginatedUsers(int $perPage = 15): LengthAwarePaginator
    {
        return User::query()->latest()->paginate($perPage);
    }

    public function createAdminUser(CreateAdminUserDTO $dto): User
    {
        return $this->createAdminUserAction->execute($dto);
    }

    public function deleteUser(int $userId): void
    {
        $user = User::findOrFail($userId);
        $user->delete();
    }

    public function resetTwoFactor(int $userId): void
    {
        $user = User::findOrFail($userId);

        $user->forceFill([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ])->save();
    }
}
