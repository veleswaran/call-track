<?php

declare(strict_types=1);

namespace App\Domain\Teams\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class TeamMember extends Pivot
{
    protected $table = 'team_members';

    public $incrementing = true;

    protected $casts = [
        'role' => 'string',
    ];
}
