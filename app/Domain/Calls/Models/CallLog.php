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

    /**
     * SQL Conditions for mutual exclusivity
     */
    public const SQL_MISSED_CONDITION = "(EXISTS (SELECT 1 FROM call_escalations WHERE call_escalations.call_log_id = call_logs.id) OR call_logs.direction IN ('MISSED', 'REJECTED', 'BLOCKED') OR (call_logs.direction = 'INCOMING' AND call_logs.duration <= 0))";

    public const SQL_NO_ANSWER_CONDITION = "(call_logs.direction = 'OUTGOING' AND call_logs.duration = 0)";

    public const SQL_CONNECTED_CONDITION = "(call_logs.duration > 0 AND NOT (EXISTS (SELECT 1 FROM call_escalations WHERE call_escalations.call_log_id = call_logs.id) OR call_logs.direction IN ('MISSED', 'REJECTED', 'BLOCKED') OR (call_logs.direction = 'INCOMING' AND call_logs.duration <= 0)))";

    /**
     * Builds a CASE statement for call outcomes
     */
    public static function getOutcomeCaseSql(): string
    {
        $missed = self::SQL_MISSED_CONDITION;
        $noAnswer = self::SQL_NO_ANSWER_CONDITION;

        return "CASE
            WHEN $missed THEN 'Missed'
            WHEN $noAnswer THEN 'No Answer'
            ELSE 'Connected'
        END";
    }

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

    /**
     * @return HasOne<\App\Domain\Calls\Models\CallEscalation, $this>
     */
    public function escalation(): HasOne
    {
        return $this->hasOne(CallEscalation::class);
    }

    /**
     * Scopes
     */
    public function scopeMissed($query)
    {
        return $query->whereRaw(self::SQL_MISSED_CONDITION);
    }

    public function scopeConnected($query)
    {
        return $query->whereRaw(self::SQL_CONNECTED_CONDITION);
    }

    public function scopeNoAnswer($query)
    {
        return $query->whereRaw(self::SQL_NO_ANSWER_CONDITION);
    }

    /**
     * PHP Helper to determine if a call is missed logic-wise.
     */
    public function isMissed(): bool
    {
        $direction = strtoupper((string) $this->direction);

        if (in_array($direction, ['MISSED', 'REJECTED', 'BLOCKED']) || ($direction === 'INCOMING' && $this->duration <= 0)) {
            return true;
        }

        // If it has an escalation, it's considered missed regardless of other conditions
        if ($this->relationLoaded('escalation') && $this->escalation !== null) {
            return true;
        }

        return false;
    }
}
