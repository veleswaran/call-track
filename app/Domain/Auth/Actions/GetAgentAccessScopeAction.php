<?php

declare(strict_types=1);

namespace App\Domain\Auth\Actions;

use App\Domain\Teams\Models\TeamMember;
use App\Domain\Users\Models\User;

/**
 * Determine which Agent IDs a user is allowed to access.
 *
 * Returns:
 *   - null: Full access (Admin/Super-Admin)
 *   - array: List of Agent IDs the user can see
 */
final class GetAgentAccessScopeAction
{
    /**
     * @return int[]|null
     */
    public function execute(User $user): ?array
    {
        // Admins see everything
        if ($user->hasRole(['super-admin', 'admin'])) {
            return null;
        }

        // If user is not linked to an agent, they shouldn't see anything agent-scoped
        if (! $user->isAgent()) {
            return [];
        }

        /** @var \App\Domain\Agents\Models\Agent $agent */
        $agent = $user->agent;

        // Start with own ID
        $accessibleIds = [$agent->id];

        // Get all agent IDs from all teams where this agent is a MANAGER
        $teamAgentIds = TeamMember::whereIn('team_id', TeamMember::select('team_id')
            ->where('agent_id', $agent->id)
            ->where('role', 'MANAGER')
        )
            ->pluck('agent_id')
            ->toArray();

        $accessibleIds = array_merge($accessibleIds, $teamAgentIds);

        return array_values(array_unique($accessibleIds));
    }
}
