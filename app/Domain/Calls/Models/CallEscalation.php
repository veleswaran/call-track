<?php

declare(strict_types=1);

namespace App\Domain\Calls\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CallEscalation extends Model
{
    use HasFactory;

    protected $fillable = [
        'call_log_id',
        'status',
        'response_due_at',
        'resolved_at',
        'resolved_by_call_id',
    ];

    protected $casts = [
        'response_due_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];

    /**
     * @return BelongsTo<CallLog, $this>
     */
    public function callLog(): BelongsTo
    {
        return $this->belongsTo(CallLog::class, 'call_log_id');
    }

    /**
     * @return BelongsTo<CallLog, $this>
     */
    public function resolvedByCall(): BelongsTo
    {
        return $this->belongsTo(CallLog::class, 'resolved_by_call_id');
    }
}
