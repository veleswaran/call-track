<?php

declare(strict_types=1);

namespace App\Services\Users;

use App\Contracts\Services\AgentManagementServiceInterface;
use App\Contracts\Services\UserManagementServiceInterface;
use App\Domain\Agents\DTOs\AgentData;
use App\Domain\Agents\Models\Agent;
use App\Domain\Teams\DTOs\AddTeamMemberDTO;
use App\Domain\Users\Actions\CreateAdminUserAction;
use App\Domain\Users\Actions\LinkUserToAgentAction;
use App\Domain\Users\Actions\UnlinkUserFromAgentAction;
use App\Domain\Users\DTOs\CreateAdminUserDTO;
use App\Domain\Users\DTOs\CreateUserWithContextDTO;
use App\Domain\Users\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class UserManagementService implements UserManagementServiceInterface
{
    public function __construct(
        protected CreateAdminUserAction $createAdminUserAction,
        protected \App\Domain\Users\Actions\GetPaginatedUsersAction $getPaginatedUsersAction,
        protected \App\Domain\Users\Actions\DeleteUserAction $deleteUserAction,
        protected \App\Domain\Users\Actions\ResetTwoFactorAction $resetTwoFactorAction,
        protected LinkUserToAgentAction $linkUserToAgentAction,
        protected UnlinkUserFromAgentAction $unlinkUserFromAgentAction,
        protected AgentManagementServiceInterface $agentService,
        protected \App\Contracts\Services\Teams\TeamManagementServiceInterface $teamManagementService,
        protected \App\Contracts\Services\Teams\TeamMemberServiceInterface $teamMemberService,
    ) {}

    public function getPaginatedUsers(\App\Domain\Users\DTOs\ListUsersDTO $dto): LengthAwarePaginator
    {
        return $this->getPaginatedUsersAction->execute($dto);
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

    public function linkUserToAgent(User $user, Agent $agent): void
    {
        $this->linkUserToAgentAction->execute($user, $agent);
    }

    public function unlinkUserFromAgent(\App\Domain\Users\DTOs\UnlinkUserFromAgentDTO $dto): void
    {
        $user = User::findOrFail($dto->userId);
        $agent = Agent::findOrFail($dto->agentId);

        $this->unlinkUserFromAgentAction->execute($user, $agent);
    }

    public function createUserWithContext(CreateUserWithContextDTO $dto): User
    {
        return DB::transaction(function () use ($dto) {
            $user = $this->createAdminUser(new CreateAdminUserDTO(
                name: $dto->name,
                email: $dto->email,
                password: $dto->password,
            ));

            if ($dto->isAgent) {
                $status = $dto->status ?? 'active';

                $agent = $this->agentService->createAgent(new AgentData(
                    name: $dto->name,
                    employeeCode: $dto->employeeCode,
                    status: $status,
                ));

                $this->linkUserToAgent($user, $agent);

                $roleName = $dto->role ? strtolower($dto->role) : null;
                if ($roleName) {
                    // Double check authorization in service layer for safety
                    // This mirrors the Request validation but protects internal calls too
                    $currentUser = auth()->user();
                    if ($currentUser) {
                        $allowedRoles = ['member', 'manager'];
                        if ($currentUser->hasRole('super-admin')) {
                            $allowedRoles = ['super-admin', 'admin', 'manager', 'member'];
                        } elseif ($currentUser->hasRole('admin')) {
                            $allowedRoles = ['admin', 'manager', 'member'];
                        }

                        if (! in_array($roleName, $allowedRoles)) {
                            throw new \Illuminate\Auth\Access\AuthorizationException("You are not authorized to assign the role {$roleName}.");
                        }
                    }

                    $user->syncRoles([$roleName]);
                }

                if ($dto->isTeam && $dto->teamId) {
                    $teamModel = $this->teamManagementService->findTeam($dto->teamId);

                    // Map user role 'manager' to Team role 'MANAGER'
                    $teamRole = $roleName === 'manager' ? 'MANAGER' : 'MEMBER';

                    $this->teamMemberService->addMember(
                        $teamModel,
                        new AddTeamMemberDTO(
                            teamId: $teamModel->id,
                            agentId: $agent->id,
                            role: $teamRole,
                        )
                    );
                }
            }

            return $user;
        });
    }
}
