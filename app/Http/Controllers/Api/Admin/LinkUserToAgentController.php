<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Domain\Agents\Models\Agent;
use App\Domain\Users\Actions\LinkUserToAgentAction;
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
        private readonly LinkUserToAgentAction $linkAction,
    ) {}

    public function __invoke(Request $request, Agent $agent): JsonResponse
    {
        $request->validate([
            'user_id' => ['required', 'exists:users,id'],
        ]);

        /** @var User $user */
        $user = User::findOrFail($request->input('user_id'));

        try {
            $this->linkAction->execute($user, $agent);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        // Return updated agent with user ?
        return response()->json([
            'message' => 'User linked successfully.',
            'agent' => $agent->fresh(['user']),
        ]);
    }
}
