<?php

declare(strict_types=1);

namespace App\Domain\Teams\Actions;

use App\Domain\Teams\Models\Team;

class GetTeamWithDetailsAction
{
    public function execute(int $teamId): Team
    {
        return Team::with(['members'])
            ->withCount([
                'members',
                'members as managers_count' => function ($query) {
                    $query->where('team_members.role', 'MANAGER');
                },
            ])
            ->findOrFail($teamId);
    }
}
