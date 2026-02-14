<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Domain\Agents\Models\Agent;
use App\Domain\Users\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controller to handle unlinking a System User from an Agent Profile.
 */
class UnlinkUserFromAgentController extends Controller
{
    public function __construct(
        private readonly \App\Contracts\Services\UserManagementServiceInterface $userService,
    ) {}

    public function __invoke(Request $request, Agent $agent): JsonResponse
    {
        $this->authorize('update', $agent);

        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
        ]);

        $dto = new \App\Domain\Users\DTOs\UnlinkUserFromAgentDTO(
            userId: (int) $validated['user_id'],
            agentId: $agent->id,
        );

        try {
            $this->userService->unlinkUserFromAgent($dto);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'User unlinked successfully.',
            'agent' => $agent->fresh(['user']),
        ]);
    }
}
