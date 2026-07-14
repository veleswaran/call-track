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

        // Use updateOrCreate in case of idempotent reprocessing
        $escalation = CallEscalation::updateOrCreate(
            ['call_log_id' => $callLog->id],
            [
                'status' => 'pending',
                'response_due_at' => $responseDueAt,
            ]
        );

        $subsequentCall = CallLog::where('phone_number_hash', $callLog->phone_number_hash)
            ->where('agent_id', $callLog->agent_id)
            ->where('timestamp', '>', $callLog->timestamp)
            ->where(function ($query) {
                $query->whereIn('direction', ['OUTGOING', 'INCOMING', 'outgoing', 'incoming'])
                    ->where('duration', '>', 0);
            })
            ->orderBy('timestamp', 'asc')
            ->first();

        if ($subsequentCall) {
            $escalation->update([
                'status' => 'resolved',
                'resolved_at' => $subsequentCall->timestamp,
                'resolved_by_call_id' => $subsequentCall->id,
            ]);
        }

        return $escalation;
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
