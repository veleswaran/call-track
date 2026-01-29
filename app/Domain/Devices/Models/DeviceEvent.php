<?php

declare(strict_types=1);

namespace App\Domain\Devices\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $device_id
 * @property string $event_type
 * @property array|null $payload
 * @property \Illuminate\Support\Carbon $occurred_at
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class DeviceEvent extends Model
{
    use HasFactory;

    /**
     * Documented/Standard event types.
     * Note: Not strictly enforced by validation to allow flexibility for mobile apps.
     */
    public const EVENT_TYPES = [
        'APP_STOPPED',
        'APP_DEREGISTERED',
        'APP_UNINSTALLED',
        'PERMISSION_DENIED',
        'PERMISSION_GRANTED',
        'BATTERY_OPTIMIZATION_ENABLED',
        'FOREGROUND_SERVICE_BLOCKED',
        'DEVICE_REBOOTED',
        'TOKEN_EXPIRED',
        'CALL_LOG_ACCESS_FAILED',
    ];

    protected $fillable = [
        'device_id',
        'event_type',
        'payload',
        'occurred_at',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'occurred_at' => 'datetime',
        ];
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }
}
