<?php

declare(strict_types=1);

namespace App\Domain\Calls\Models;

use App\Domain\Devices\Models\Device;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $device_id
 * @property string $name
 * @property string $phone_hash
 * @property string|null $phone_number
 * @property string|null $notes
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property-read Device $device
 */
class Contact extends Model
{
    use HasFactory;

    protected $fillable = [
        'device_id',
        'name',
        'phone_hash',
        'phone_number',
        'notes',
    ];

    protected $casts = [
        'phone_number' => 'encrypted',
    ];

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }
}
