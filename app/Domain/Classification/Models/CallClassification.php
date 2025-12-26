<?php

declare(strict_types=1);

namespace App\Domain\Classification\Models;

use App\Domain\Calls\Models\CallLog;
use App\Domain\Users\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CallClassification extends Model
{
    use HasFactory;

    protected static function newFactory()
    {
        return \Database\Factories\CallClassificationFactory::new();
    }

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
