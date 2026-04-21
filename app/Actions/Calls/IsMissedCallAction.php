<?php

declare(strict_types=1);

namespace App\Actions\Calls;

use App\Domain\Calls\Models\CallLog;

/**
 * Encapsulates the business logic to determine if a call is 'Missed'.
 */
final class IsMissedCallAction
{
    /**
     * Determine if the given call log represents a missed call.
     */
    public function execute(CallLog $callLog): bool
    {
        $direction = strtoupper((string) $callLog->direction);

        // Standard direction-based missed call logic
        if (in_array($direction, ['MISSED', 'REJECTED', 'BLOCKED'])) {
            return true;
        }

        // Incoming calls with no duration
        if ($direction === 'INCOMING' && $callLog->duration <= 0) {
            return true;
        }

        // Explicit check for existing escalation (even if duration/direction says otherwise)
        if ($callLog->relationLoaded('escalation') && $callLog->escalation !== null) {
            return true;
        }

        return false;
    }
}
