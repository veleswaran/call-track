<?php

declare(strict_types=1);

namespace App\Domain\Teams\Actions;

use App\Domain\Agents\Models\Agent;
use App\Domain\Teams\Models\Team;

class AddAgentToTeamAction
{
    public function execute(Team $team, Agent $agent): void
    {
        // Prevent duplicates
        if (! $team->members()->where('agent_id', $agent->id)->exists()) {
            $team->members()->attach($agent->id, ['role' => 'MEMBER']);

            // Sync Spatie Role
            /** @var \App\Domain\Users\Models\User|null $user */
            $user = $agent->user;
            if ($user && ! $user->hasRole('super-admin')) {
                $user->syncRoles(['member']); // Default to member
            }
        }
    }
}
