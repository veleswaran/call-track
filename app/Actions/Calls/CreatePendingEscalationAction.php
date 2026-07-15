<?php

declare(strict_types=1);

namespace App\Actions\Calls;

use App\Domain\Calls\Models\CallEscalation;
use App\Domain\Calls\Models\CallLog;

class CreatePendingEscalationAction
{
    public function __construct(private readonly CalculateSlaDeadlineAction $calculateSlaDeadlineAction) {}

    public function execute(CallLog $callLog): ?CallEscalation
    {
        if (! $this->isMissedCall($callLog)) {
            return null; // Only escalate missed calls
        }

        $responseDueAt = $this->calculateSlaDeadlineAction->execute($callLog->timestamp);

        $subsequentCall = CallLog::where('phone_number_hash', $callLog->phone_number_hash)
            ->when($callLog->agent_id !== null, function ($query) use ($callLog) {
                $query->where('agent_id', $callLog->agent_id);
            })
            ->where('timestamp', '>', $callLog->timestamp)
            ->where(function ($query) {
                $query->whereIn('direction', ['OUTGOING', 'INCOMING', 'outgoing', 'incoming'])
                    ->where('duration', '>', 0);
            })
            ->orderBy('timestamp', 'asc')
            ->first();

        return CallEscalation::updateOrCreate(
            ['call_log_id' => $callLog->id],
            [
                'status' => $subsequentCall ? 'resolved' : 'pending',
                'response_due_at' => $responseDueAt,
                'resolved_at' => $subsequentCall?->timestamp,
                'resolved_by_call_id' => $subsequentCall?->id,
            ]
        );
    }

    private function isMissedCall(CallLog $callLog): bool
    {
        $direction = strtoupper($callLog->direction);
        if (in_array($direction, ['MISSED', 'REJECTED', 'BLOCKED'])) {
            return true;
        }

        if ($direction === 'INCOMING' && $callLog->duration === 0) {
            return true;
        }

        return false;
    }
}
