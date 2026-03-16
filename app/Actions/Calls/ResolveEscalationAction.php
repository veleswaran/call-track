<?php

declare(strict_types=1);

namespace App\Actions\Calls;

use App\Domain\Calls\Models\CallEscalation;
use App\Domain\Calls\Models\CallLog;

class ResolveEscalationAction
{
    public function execute(CallLog $outgoingCallLog): int
    {
        // Only outgoing calls with duration > 0 can resolve escalations
        if (strtoupper($outgoingCallLog->direction) !== 'OUTGOING' || $outgoingCallLog->duration === 0) {
            return 0;
        }

        $escalations = CallEscalation::whereIn('status', ['pending', 'unattended'])
            ->whereHas('callLog', function ($query) use ($outgoingCallLog) {
                // Determine if it was the exact same agent, and exact same phone number,
                // and the missed call happened before this outgoing call
                $query->where('phone_number_hash', $outgoingCallLog->phone_number_hash)
                    ->where('agent_id', $outgoingCallLog->agent_id)
                    ->where('timestamp', '<', $outgoingCallLog->timestamp);
            })
            ->get();

        if ($escalations->isEmpty()) {
            return 0;
        }

        $updatedCount = 0;

        foreach ($escalations as $escalation) {
            // Using update to properly fire model events, although mass update is faster,
            // since this is per-call, iterating is safe and lets us use individual timestamps based on the outgoing call
            // Wait, resolved_at should be the timestamp of the OUTGOING call, not 'now', to handle idempotent late-syncs!

            $escalation->update([
                'status' => 'resolved',
                'resolved_at' => $outgoingCallLog->timestamp,
                'resolved_by_call_id' => $outgoingCallLog->id,
            ]);
            $updatedCount++;
        }

        return $updatedCount;
    }
}
