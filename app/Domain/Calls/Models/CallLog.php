<?php

declare(strict_types=1);

namespace App\Domain\Calls\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Domain\Devices\Models\Device;
use App\Domain\Classification\Models\CallClassification;
use App\Domain\Classification\Models\CallNote;

class CallLog extends Model
{
    const UPDATED_AT = null;

    protected $fillable = [
        'device_id',
        'call_hash',
        'phone_number_hash',
        'direction',
        'duration',
        'timestamp',
        'created_at',
    ];

    protected $casts = [
        'timestamp' => 'datetime',
        'created_at' => 'datetime',
        'duration' => 'integer',
    ];

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }

    public function classification(): HasOne
    {
        return $this->hasOne(CallClassification::class);
    }

    public function notes(): HasMany
    {
        return $this->hasMany(CallNote::class);
    }
}
