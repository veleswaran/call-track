<?php

declare(strict_types=1);

namespace App\Domain\Classification\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Domain\Calls\Models\CallLog;
use App\Domain\Users\Models\User;

class CallClassification extends Model
{
    protected $fillable = [
        'call_log_id',
        'user_id',
        'type',
        'reason',
    ];

    public function callLog(): BelongsTo
    {
        return $this->belongsTo(CallLog::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
