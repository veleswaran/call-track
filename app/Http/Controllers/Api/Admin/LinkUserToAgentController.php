<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Domain\Agents\Models\Agent;
use App\Domain\Users\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controller to handle binding a System User to an Agent Profile.
 */
class LinkUserToAgentController extends Controller
{
    public function __construct(
        private readonly \App\Contracts\Services\UserManagementServiceInterface $userService,
    ) {}

    public function __invoke(Request $request, Agent $agent): JsonResponse
    {
        $this->authorize('create', User::class);

        $request->validate([
            'user_id' => ['required', 'exists:users,id'],
        ]);

        /** @var User $user */
        $user = User::findOrFail($request->input('user_id'));

        try {
            $this->userService->linkUserToAgent($user, $agent);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'User linked successfully.',
            'agent' => $agent->fresh(['user']),
        ]);
    }
}
