<?php

declare(strict_types=1);

namespace App\Domain\Teams\Models;

use App\Domain\Agents\Models\Agent;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Team extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
    ];

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(Agent::class, 'team_members')
            ->using(TeamMember::class)
            ->withPivot('role')
            ->withTimestamps();
    }

    public function managers(): BelongsToMany
    {
        return $this->members()->wherePivot('role', 'MANAGER');
    }
}
