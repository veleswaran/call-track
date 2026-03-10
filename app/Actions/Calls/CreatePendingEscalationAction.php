<?php

declare(strict_types=1);

namespace App\Actions\Calls;

use App\Domain\Calls\Models\CallEscalation;
use App\Domain\Calls\Models\CallLog;

class CreatePendingEscalationAction
{
    private CalculateSlaDeadlineAction $calculateSlaDeadlineAction;

    public function __construct(CalculateSlaDeadlineAction $calculateSlaDeadlineAction)
    {
        $this->calculateSlaDeadlineAction = $calculateSlaDeadlineAction;
    }

    public function execute(CallLog $callLog): ?CallEscalation
    {
        if (! $this->isMissedCall($callLog)) {
            return null; // Only escalate missed calls
        }

        $responseDueAt = $this->calculateSlaDeadlineAction->execute($callLog->timestamp);

        // Use updateOrCreate in case of idempotent reprocessing
        return CallEscalation::updateOrCreate(
            ['call_log_id' => $callLog->id],
            [
                'status' => 'pending',
                'response_due_at' => $responseDueAt,
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
