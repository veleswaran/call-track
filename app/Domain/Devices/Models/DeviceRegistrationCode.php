<?php

declare(strict_types=1);

namespace App\Domain\Devices\Models;

use App\Domain\Agents\Models\Agent;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property string $code
 * @property int|null $agent_id
 * @property \Illuminate\Support\Carbon $expires_at
 * @property \Illuminate\Support\Carbon|null $used_at
 * @property int|null $used_by_device_id
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property-read Agent|null $agent
 * @property-read Device|null $usedByDevice
 */
class DeviceRegistrationCode extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'agent_id',
        'expires_at',
        'used_at',
        'used_by_device_id',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
    ];

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }

    public function usedByDevice(): BelongsTo
    {
        return $this->belongsTo(Device::class, 'used_by_device_id');
    }

    public function isValid(): bool
    {
        return is_null($this->used_at) && $this->expires_at->isFuture();
    }
}
