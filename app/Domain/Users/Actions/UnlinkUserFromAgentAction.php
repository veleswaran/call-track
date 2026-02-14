<?php

declare(strict_types=1);

namespace App\Domain\Users\Actions;

use App\Domain\Agents\Models\Agent;
use App\Domain\Users\Models\User;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Unlinks a User from an Agent Profile.
 */
final class UnlinkUserFromAgentAction
{
    public function execute(User $user, Agent $agent): void
    {
        // Check if they are actually linked
        if ($agent->user_id !== $user->id) {
            throw new InvalidArgumentException('Agent is not linked to this user.');
        }

        DB::transaction(function () use ($agent) {
            $agent->update(['user_id' => null]);
        });
    }
}
