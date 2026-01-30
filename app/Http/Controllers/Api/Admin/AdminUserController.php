<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Contracts\Services\UserManagementServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAdminUserRequest;
use App\Http\Resources\AdminUserResource;
use Illuminate\Http\JsonResponse;

class AdminUserController extends Controller
{
    public function __construct(
        protected UserManagementServiceInterface $userService,
    ) {}

    public function index(): JsonResponse
    {
        // Simple list for now
        $users = $this->userService->getPaginatedUsers();

        return response()->json(AdminUserResource::collection($users)->response()->getData());
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
}
