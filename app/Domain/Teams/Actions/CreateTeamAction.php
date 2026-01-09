<?php

declare(strict_types=1);

namespace App\Domain\Teams\Actions;

use App\Domain\Teams\Models\Team;

class CreateTeamAction
{
    public function execute(string $name): Team
    {
        return Team::create([
            'name' => $name,
        ]);
    }
}
