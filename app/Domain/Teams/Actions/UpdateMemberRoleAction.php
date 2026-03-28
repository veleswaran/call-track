<?php

declare(strict_types=1);

namespace App\Domain\Teams\Actions;

use App\Domain\Agents\Models\Agent;
use App\Domain\Teams\Models\Team;

class UpdateMemberRoleAction
{
    public function execute(Team $team, Agent $agent, string $role): void
    {
        $team->members()->updateExistingPivot($agent->id, ['role' => $role]);

        // Sync Spatie Role
        // Logic:
        // - If assigning MANAGER -> User gets 'manager' role
        // - If assigning MEMBER -> User gets 'member' role (promoted/demoted)
        // - DO NOT override Super Admin or Admin roles

        /** @var \App\Domain\Users\Models\User|null $user */
        $user = $agent->user;

        if ($user) {
            // Basic protection: If user is Admin/Super Admin, we probably shouldn't demote them to Member/Manager?
            // Or maybe we treat 'manager' role as "Team Manager permission" which is additive?
            // Current Requirement: "When I change... role is also change the spati role".
            // Implication: Reflect the change.

            // Check high level roles
            if ($user->hasRole(['super-admin', 'admin'])) {
                return; // Do not mess with admin or super-admin permissions
            }

            if ($role === 'MANAGER') {
                $user->syncRoles(['manager']);
            } elseif ($role === 'MEMBER') {
                $user->syncRoles(['member']);
            }
        }
    }
}
