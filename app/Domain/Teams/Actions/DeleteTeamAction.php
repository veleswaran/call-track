<?php

declare(strict_types=1);

namespace App\Domain\Teams\Actions;

use App\Domain\Teams\Models\Team;

class DeleteTeamAction
{
    public function execute(Team $team): void
    {
        $team->delete();
    }
}
