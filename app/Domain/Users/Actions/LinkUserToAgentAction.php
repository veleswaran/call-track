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
        /** @var Agent|null $currentAgent */
        $currentAgent = $user->agent;

        if ($currentAgent !== null) {
            if ($currentAgent->id === $agent->id) {
                return;
            }
            throw new InvalidArgumentException('User is already linked to another agent.');
        }

        if ($agent->user_id !== null && $agent->user_id !== $user->id) {
            throw new InvalidArgumentException('Agent is already linked to another user context.');
        }

        DB::transaction(function () use ($user, $agent) {
            $agent->update(['user_id' => $user->id]);
        });
    }
}
