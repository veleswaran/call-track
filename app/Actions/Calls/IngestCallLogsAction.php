<?php

declare(strict_types=1);

namespace App\Actions\Calls;

use App\Domain\Calls\DTOs\SyncCallLogsDTO;
use App\Domain\Calls\Models\CallLog;
use App\Domain\Classification\Models\CallClassification;
use App\Domain\Classification\Models\CallNote;
use App\Jobs\ProcessCallLogAnalytics;

class IngestCallLogsAction
{
    /**
     * @return array{ingested: int, skipped: int, skipped_slots: int[]}
     */
    public function execute(SyncCallLogsDTO $dto): array
    {
        $records = [];
        $classificationMap = []; // call_hash => [type, note, agentId]
        $now = now();
        $trackedSlots = $dto->device->tracked_sim_slots;
        $skippedCount = 0;
        $skippedSlots = [];

        foreach ($dto->logs as $log) {
            // Filter by tracked SIM slots if configured
            if ($trackedSlots !== null && ! in_array($log->simSlot, $trackedSlots, true)) {
                $skippedCount++;
                if (! in_array($log->simSlot, $skippedSlots, true)) {
                    $skippedSlots[] = $log->simSlot;
                }

                continue;
            }

            // Normalize phone number before hashing for consistent search
            $normalizedPhone = \App\Support\PhoneNormalizer::normalize($log->phoneNumber);

            $records[] = [
                'device_id' => $dto->device->id,
                'call_hash' => $log->callHash,
                'phone_number_hash' => hash('sha256', $normalizedPhone),
                'phone_number' => \Illuminate\Support\Facades\Crypt::encryptString($log->phoneNumber),
                'direction' => $log->direction,
                'duration' => $log->duration,
                'timestamp' => $log->timestamp,
                'sim_slot' => $log->simSlot,
                'created_at' => $now,
            ];

            // Track classification info for this log
            $classificationMap[$log->callHash] = [
                'type' => $log->extra['classification'] ?? 'BUSINESS',
                'note' => $log->extra['note'] ?? null,
                'metadata' => $log->extra['metadata'] ?? null,
                'agent_id' => $dto->device->agent_id,
            ];
        }

        if (empty($records)) {
            return [
                'ingested' => 0,
                'skipped' => $skippedCount,
                'skipped_slots' => $skippedSlots,
            ];
        }

        // Chunking for large batches
        foreach (array_chunk($records, 500) as $chunk) {
            CallLog::insertOrIgnore($chunk);

            // Get IDs for these logs to insert classifications
            $hashes = array_column($chunk, 'call_hash');
            $logsByHash = CallLog::where('device_id', $dto->device->id)
                ->whereIn('call_hash', $hashes)
                ->get()
                ->keyBy('call_hash');

            $classifications = [];
            $notes = [];

            foreach ($logsByHash as $hash => $callLog) {
                $classInfo = $classificationMap[$hash] ?? ['type' => 'BUSINESS', 'note' => null, 'metadata' => null, 'agent_id' => null];

                $classifications[] = [
                    'call_log_id' => $callLog->id,
                    'type' => $classInfo['type'],
                    'user_id' => null,
                    'agent_id' => $classInfo['agent_id'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                // If note or metadata provided, add to notes table
                if (! empty($classInfo['note']) || ! empty($classInfo['metadata'])) {
                    $notes[] = [
                        'call_log_id' => $callLog->id,
                        'user_id' => null,
                        'agent_id' => $classInfo['agent_id'],
                        'note' => $classInfo['note'] ?? null,
                        'metadata' => $classInfo['metadata'] ?? null,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }

            if (! empty($classifications)) {
                // Upsert: update type/agent if classification already exists
                CallClassification::upsert(
                    $classifications,
                    ['call_log_id'], // unique key
                    ['type', 'agent_id', 'updated_at'] // columns to update
                );
            }

            // Only insert notes for new call logs (avoid duplicates on re-sync)
            // For re-sync scenarios, notes are additive only if the call log is new
            if (! empty($notes)) {
                // Upsert: update note content if note already exists for this call_log_id
                CallNote::upsert(
                    $notes,
                    ['call_log_id'], // unique key
                    ['note', 'metadata', 'agent_id', 'updated_at'] // columns to update
                );
            }
        }

        // Dispatch analytics job for the device
        ProcessCallLogAnalytics::dispatch($dto->device->id);

        return [
            'ingested' => count($records),
            'skipped' => $skippedCount,
            'skipped_slots' => $skippedSlots,
        ];
    }
}
