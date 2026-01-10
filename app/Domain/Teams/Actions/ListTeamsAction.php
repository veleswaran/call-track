<?php

declare(strict_types=1);

namespace App\Domain\Teams\Actions;

use App\Domain\Teams\Models\Team;
use Illuminate\Database\Eloquent\Collection;

class ListTeamsAction
{
    public function execute(): Collection
    {
        return Team::withCount([
            'members',
            'members as managers_count' => function ($query) {
                $query->where('team_members.role', 'MANAGER');
            },
        ])->get();
    }
}
