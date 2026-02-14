<?php

declare(strict_types=1);

namespace App\Contracts\Services;

use App\Domain\Agents\Models\Agent;
use App\Domain\Users\DTOs\CreateAdminUserDTO;
use App\Domain\Users\DTOs\CreateUserWithContextDTO;
use App\Domain\Users\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

interface UserManagementServiceInterface
{
    /**
     * Get paginated users.
     */
    public function getPaginatedUsers(\App\Domain\Users\DTOs\ListUsersDTO $dto): LengthAwarePaginator;

    /**
     * Create a new admin user.
     */
    public function createAdminUser(CreateAdminUserDTO $dto): User;

    /**
     * Delete a user.
     */
    public function deleteUser(int $userId): void;

    /**
     * Reset 2FA for a user.
     */
    public function resetTwoFactor(int $userId): void;

    /**
     * Link a User to an Agent profile.
     */
    public function linkUserToAgent(User $user, Agent $agent): void;

    /**
     * Create a user with agent and team context.
     */
    public function createUserWithContext(CreateUserWithContextDTO $dto): User;

    /**
     * Unlink a User from an Agent profile.
     */
    public function unlinkUserFromAgent(User $user, Agent $agent): void;
}
