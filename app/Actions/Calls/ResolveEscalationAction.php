<?php

declare(strict_types=1);

namespace App\Actions\Calls;

use App\Domain\Calls\Models\CallEscalation;
use App\Domain\Calls\Models\CallLog;

class ResolveEscalationAction
{
    public function execute(CallLog $callLog): int
    {
        // Only connected calls (INCOMING or OUTGOING with duration > 0) can resolve escalations
        if (! in_array(strtoupper($callLog->direction), ['OUTGOING', 'INCOMING'], true) || $callLog->duration === 0) {
            return 0;
        }

        $escalations = CallEscalation::whereIn('status', ['pending', 'unattended'])
            ->whereHas('callLog', function ($query) use ($callLog) {
                // Determine if it was the exact same agent, and exact same phone number,
                // and the missed call happened before this call
                $query->where('phone_number_hash', $callLog->phone_number_hash)
                    ->where('agent_id', $callLog->agent_id)
                    ->where('timestamp', '<', $callLog->timestamp);
            })
            ->get();

        if ($escalations->isEmpty()) {
            return 0;
        }

        $updatedCount = 0;

        foreach ($escalations as $escalation) {
            // Using update to properly fire model events, although mass update is faster,
            // since this is per-call, iterating is safe and lets us use individual timestamps based on the call
            // Wait, resolved_at should be the timestamp of the call, not 'now', to handle idempotent late-syncs!

            $escalation->update([
                'status' => 'resolved',
                'resolved_at' => $callLog->timestamp,
                'resolved_by_call_id' => $callLog->id,
            ]);
            $updatedCount++;
        }

        return $updatedCount;
    }
}
