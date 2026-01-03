<?php

declare(strict_types=1);

namespace App\Actions\Calls;

use App\Domain\Calls\DTOs\SyncCallLogsDTO;
use App\Domain\Calls\Models\CallLog;
use App\Jobs\ProcessCallLogAnalytics;

class IngestCallLogsAction
{
    public function execute(SyncCallLogsDTO $dto): void
    {
        $records = [];
        $now = now();
        $trackedSlots = $dto->device->tracked_sim_slots;

        foreach ($dto->logs as $log) {
            // Filter by tracked SIM slots if configured
            if ($trackedSlots !== null && ! in_array($log->simSlot, $trackedSlots, true)) {
                continue;
            }

            $records[] = [
                'device_id' => $dto->device->id,
                'call_hash' => $log->callHash,
                'phone_number_hash' => hash('sha256', $log->phoneNumber),
                'phone_number' => \Illuminate\Support\Facades\Crypt::encryptString($log->phoneNumber),
                'direction' => $log->direction,
                'duration' => $log->duration,
                'timestamp' => $log->timestamp,
                'sim_slot' => $log->simSlot,
                'created_at' => $now,
            ];
        }

        if (empty($records)) {
            return;
        }

        // Chunking for large batches
        foreach (array_chunk($records, 500) as $chunk) {
            CallLog::insertOrIgnore($chunk);

            // Get IDs for these logs to insert default classification
            $hashes = array_column($chunk, 'call_hash');
            $logIds = CallLog::where('device_id', $dto->device->id)
                ->whereIn('call_hash', $hashes)
                ->pluck('id');

            $classifications = $logIds->map(fn ($id) => [
                'call_log_id' => $id,
                'type' => 'BUSINESS', // Default to BUSINESS
                'user_id' => null,
                'agent_id' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ])->toArray();

            if (! empty($classifications)) {
                \App\Domain\Classification\Models\CallClassification::insertOrIgnore($classifications);
            }
        }

        // Dispatch analytics job for the device
        // We trigger a re-calculation for the affected dates or just generic sync.
        // Passing device_id is safe.
        ProcessCallLogAnalytics::dispatch($dto->device->id);
    }
}
