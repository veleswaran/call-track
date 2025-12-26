<?php

declare(strict_types=1);

namespace App\Domain\Analytics\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Domain\Devices\Models\Device;

class AnalyticsDaily extends Model
{
    protected $table = 'analytics_daily';

    protected $fillable = [
        'date',
        'device_id',
        'total_calls',
        'total_duration',
        'business_calls',
        'personal_calls',
        'ignored_calls',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }
}
