<?php

declare(strict_types=1);

namespace App\Domain\Teams\Actions;

use App\Domain\Agents\Models\Agent;
use App\Domain\Teams\Models\Team;

class RemoveMemberFromTeamAction
{
    public function execute(Team $team, Agent $agent): void
    {
        $team->members()->detach($agent->id);
    }
}
