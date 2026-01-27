<?php

declare(strict_types=1);

namespace App\Domain\Users\Actions;

use App\Domain\Agents\Models\Agent;
use App\Domain\Users\Models\User;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Validates user is not already linked and links User to Agent.
 */
final class LinkUserToAgentAction
{
    public function execute(User $user, Agent $agent): void
    {
        // Check if user is already linked to ANY agent
        if ($user->agent()->exists()) {
            // If trying to link to same agent, maybe idempotent OK? But let's be strict as per plan "Validates user is not already linked".
            // Actually, if it's the SAME agent, it's fine.
            if ($user->agent->id === $agent->id) {
                return;
            }
            throw new InvalidArgumentException("User is already linked to another agent.");
        }

        // Check if Agent is already linked to another user
        if ($agent->user_id !== null && $agent->user_id !== $user->id) {
            throw new InvalidArgumentException("Agent is already linked to another user context.");
        }

        DB::transaction(function () use ($user, $agent) {
            $agent->update(['user_id' => $user->id]);
        });
    }
}
