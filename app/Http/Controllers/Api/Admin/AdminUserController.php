<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Contracts\Services\AgentManagementServiceInterface;
use App\Contracts\Services\TeamServiceInterface;
use App\Contracts\Services\UserManagementServiceInterface;
use App\Domain\Agents\DTOs\AgentData;
use App\Domain\Teams\DTOs\AddTeamMemberDTO;
use App\Domain\Users\Actions\LinkUserToAgentAction;
use App\Domain\Users\DTOs\CreateAdminUserDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAdminUserRequest;
use App\Http\Resources\AdminUserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminUserController extends Controller
{
    public function __construct(
        protected UserManagementServiceInterface $userService,
        protected AgentManagementServiceInterface $service,
        protected TeamServiceInterface $teamService,
        private readonly LinkUserToAgentAction $linkAction,
    ) {
        // Enforce permissions if needed, or rely on Request authorization
        // Middleware removed as Controller doesn't support it directly. Use Route middleware.
    }

    public function index(): JsonResponse
    {
        // Simple list for now
        $users = $this->userService->getPaginatedUsers();

        return response()->json(AdminUserResource::collection($users)->response()->getData());
    }

    public function store(StoreAdminUserRequest $request): JsonResponse
    {
        DB::beginTransaction();
        try {
            $dto = new CreateAdminUserDTO(
                name: $request->validated('name'),
                email: $request->validated('email'),
                password: $request->validated('password'),
            );
            $user = $this->userService->createAdminUser($dto);
            if ($request->is_agent) {
                $agent = $this->service->createAgent(
                    new AgentData(name: $request->validated('name'), employeeCode: $request->validated('employee_code'), status: $request->validated('status'))
                );
                $this->linkAction->execute($user, $agent);
                $roleName = strtolower($request->validated('role'));
                $user->syncRoles([$roleName]);
                if ($request->is_team) {
                    $teamModel = $this->teamService->findTeam((int) $request->validated('team_id'));
                    // Map user role 'manager' to Team role 'MANAGER'
                    $teamRole = $roleName === 'manager' ? 'MANAGER' : 'MEMBER';

                    $this->teamService->addMember(
                        $teamModel,
                        new AddTeamMemberDTO(
                            teamId: $teamModel->id,
                            agentId: $agent->id,
                            role: $teamRole,
                        )
                    );
                }
            }
            DB::commit();

            return response()->json([
                'message' => 'Admin user created successfully.',
                'user' => new AdminUserResource($user),
            ], 201);

        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json(['message' => 'User creation failed. All changes reverted.', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        $user = \App\Domain\Users\Models\User::findOrFail($id);

        $this->authorize('delete', $user);

        $this->userService->deleteUser($id);

        return response()->json(['message' => 'User deleted successfully.']);
    }

    public function resetTwoFactor(int $id): JsonResponse
    {
        $this->userService->resetTwoFactor($id);

        return response()->json(['message' => 'Two-factor authentication reset successfully.']);
    }
}
