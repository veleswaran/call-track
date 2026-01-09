<?php

declare(strict_types=1);

namespace App\Domain\Teams\Actions;

use App\Domain\Agents\Models\Agent;
use App\Domain\Teams\Models\Team;

class AssignTeamManagerAction
{
    public function execute(Team $team, Agent $agent): void
    {
        // Check if agent is already a member
        $existing = $team->members()->where('agent_id', $agent->id)->first();

        if ($existing) {
            // Update role to MANAGER
            $team->members()->updateExistingPivot($agent->id, ['role' => 'MANAGER']);
        } else {
            // Add as MANAGER
            $team->members()->attach($agent->id, ['role' => 'MANAGER']);
        }
    }
}
