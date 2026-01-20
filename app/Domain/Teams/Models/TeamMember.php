<?php

declare(strict_types=1);

namespace App\Domain\Teams\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

/**
 * @property int $id
 * @property int $team_id
 * @property int $agent_id
 * @property string $role
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class TeamMember extends Pivot
{
    protected $table = 'team_members';

    public $incrementing = true;

    protected $casts = [
        'role' => 'string',
    ];
}
