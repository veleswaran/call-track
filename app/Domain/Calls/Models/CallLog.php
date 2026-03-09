<?php

declare(strict_types=1);

namespace App\Domain\Calls\Models;

use App\Domain\Agents\Models\Agent;
use App\Domain\Classification\Models\CallClassification;
use App\Domain\Devices\Models\Device;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * @property int $id
 * @property int $device_id
 * @property int|null $agent_id
 * @property string $direction
 * @property int $duration
 * @property \Illuminate\Support\Carbon $timestamp
 * @property \Illuminate\Support\Carbon $created_at
 * @property-read string|null $call_outcome
 * @property-read Device $device
 * @property-read Agent|null $agent
 * @property-read CallClassification|null $classification
 */
class CallLog extends Model
{
    use HasFactory;

    protected static function newFactory()
    {
        return \Database\Factories\CallLogFactory::new();
    }

    const UPDATED_AT = null;

    protected $fillable = [
        'device_id',
        'agent_id',
        'call_hash',
        'phone_number_hash', // We keep hash for lookups/deduplication
        'phone_number',      // Encrypted
        'phone_contact_name',
        'sim_slot',
        'direction',
        'duration',
        'timestamp',
        'created_at',
    ];

    protected $casts = [
        'timestamp' => 'datetime',
        'created_at' => 'datetime',
        'duration' => 'integer',
        'sim_slot' => 'integer',
        'phone_number' => 'encrypted',
    ];

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }

    public function classification(): HasOne
    {
        return $this->hasOne(CallClassification::class);
    }
}
