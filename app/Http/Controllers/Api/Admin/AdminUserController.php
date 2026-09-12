<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Contracts\Services\UserManagementServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ResetUserPasswordRequest;
use App\Http\Requests\Admin\StoreAdminUserRequest;
use App\Http\Resources\AdminUserResource;
use Illuminate\Http\JsonResponse;

class AdminUserController extends Controller
{
    public function __construct(
        protected UserManagementServiceInterface $userService,
    ) {}

    public function index(\Illuminate\Http\Request $request): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $this->authorize('viewAny', \App\Domain\Users\Models\User::class);

        $dto = \App\Domain\Users\DTOs\ListUsersDTO::fromRequest($request);
        $users = $this->userService->getPaginatedUsers($dto);

        return AdminUserResource::collection($users);
    }

    public function store(StoreAdminUserRequest $request): JsonResponse
    {
        $dto = \App\Domain\Users\DTOs\CreateUserWithContextDTO::fromArray($request->validated());

        $user = $this->userService->createUserWithContext($dto);

        return response()->json([
            'message' => 'Admin user created successfully.',
            'user' => new AdminUserResource($user),
        ], 201);
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

    public function resetPassword(ResetUserPasswordRequest $request, int $id): JsonResponse
    {
        $user = \App\Domain\Users\Models\User::findOrFail($id);

        $this->authorize('resetPassword', $user);

        $this->userService->resetPassword($id, $request->validated('password'));

        return response()->json(['message' => 'Password reset successfully.']);
    }
}
