<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Contracts\Services\Users\UserRoleServiceInterface;
use App\Domain\Users\DTOs\SwitchUserRoleDTO;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class UserRoleController extends Controller
{
    public function __construct(
        protected UserRoleServiceInterface $userRoleService
    ) {}

    public function update(Request $request, int $userId): Response
    {
        $request->validate([
            'role' => ['required', 'string', 'exists:roles,name'],
        ]);

        $this->userRoleService->switchRole(
            $request->user(),
            new SwitchUserRoleDTO(
                targetUserId: $userId,
                newRole: $request->input('role')
            )
        );

        return response()->noContent();
    }
}
