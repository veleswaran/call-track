<?php

declare(strict_types=1);

namespace App\Domain\Devices\Models;

use App\Domain\Calls\Models\CallLog;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $device_uuid
 * @property string $name
 * @property string $model
 * @property string|null $os_version
 * @property string|null $app_version
 * @property int|null $agent_id
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property bool|null $active_tokens_exists
 * @property array|null $tracked_sim_slots
 * @property \Illuminate\Support\Carbon|null $last_heartbeat_at
 */
class Device extends Model
{
    use HasFactory;

    protected static function newFactory()
    {
        return \Database\Factories\DeviceFactory::new();
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'device_uuid',
        'name',
        'model',
        'os_version',
        'app_version',
        'user_id',
        'agent_id',
        'tracked_sim_slots',
        'battery_level',
        'last_heartbeat_at',
        'metadata',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tracked_sim_slots' => 'array',
            'last_heartbeat_at' => 'datetime',
            'metadata' => 'string',
        ];
    }

    public function agent(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Domain\Agents\Models\Agent::class);
    }

    public function tokens(): HasMany
    {
        return $this->hasMany(DeviceToken::class);
    }

    public function activeTokens(): HasMany
    {
        return $this->hasMany(DeviceToken::class)->active();
    }

    public function callLogs(): HasMany
    {
        return $this->hasMany(CallLog::class);
    }
}
