<?php

declare(strict_types=1);

namespace App\Domain\Agents\Models;

use App\Domain\Devices\Models\Device;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property string|null $employee_code
 * @property int|null $agent_status_id
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property-read \App\Domain\Agents\Models\AgentStatus|null $agentStatus
 */
class Agent extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'employee_code',
        'agent_status_id',
        'user_id',
    ];

    public function agentStatus(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(AgentStatus::class);
    }

    protected static function newFactory()
    {
        return \Database\Factories\AgentFactory::new();
    }

    public function devices(): HasMany
    {
        return $this->hasMany(Device::class);
    }

    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Domain\Users\Models\User::class);
    }

    public function teams(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(\App\Domain\Teams\Models\Team::class, 'team_members')
            ->using(\App\Domain\Teams\Models\TeamMember::class)
            ->withPivot('role')
            ->withTimestamps();
    }
}
