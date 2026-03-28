<?php

declare(strict_types=1);

namespace App\Domain\Teams\Actions;

use App\Domain\Teams\Models\Team;

class UpdateTeamAction
{
    public function execute(Team $team, string $name): Team
    {
        $team->update(['name' => $name]);

        return $team->refresh();
    }
}
