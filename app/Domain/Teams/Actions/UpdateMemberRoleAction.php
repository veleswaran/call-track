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
    }
}
