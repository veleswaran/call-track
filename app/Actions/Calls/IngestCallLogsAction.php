<?php

declare(strict_types=1);

namespace App\Actions\Calls;

use App\Domain\Calls\DTOs\SyncCallLogsDTO;
use App\Domain\Calls\Models\CallLog;
use App\Domain\Classification\Models\CallClassification;
use App\Jobs\MissedCalls\AttemptEscalationResolutionJob;
use App\Jobs\MissedCalls\ProcessMissedCallEscalationJob;
use App\Jobs\ProcessCallLogAnalytics;

class IngestCallLogsAction
{
    /**
     * @return array{ingested: int, skipped: int, skipped_slots: int[]}
     */
    public function execute(SyncCallLogsDTO $dto): array
    {
        $records = [];
        $classificationMap = []; // call_hash => [type, note, metadata, agentId]
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
                'agent_id' => $dto->device->agent_id,
                'call_hash' => $log->callHash,
                'phone_number_hash' => hash('sha256', $normalizedPhone),
                'phone_number' => \Illuminate\Support\Facades\Crypt::encryptString($log->phoneNumber),
                'phone_contact_name' => $log->phoneContactName,
                'direction' => $log->direction,
                'duration' => $log->duration,
                'timestamp' => $log->timestamp,
                'sim_slot' => $log->simSlot,
                'created_at' => $now,
            ];

            // Track classification info for this log (now includes note and metadata)
            $classificationMap[$log->callHash] = [
                'type' => $log->extra['classification'] ?? 'BUSINESS',
                'note' => ! empty($log->extra['note']) ? $log->extra['note'] : null,
                'metadata' => ! empty($log->extra['metadata']) ? $log->extra['metadata'] : null,
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

            foreach ($logsByHash as $hash => $callLog) {
                $classInfo = $classificationMap[$hash] ?? ['type' => 'BUSINESS', 'note' => null, 'metadata' => null];

                $classifications[] = [
                    'call_log_id' => $callLog->id,
                    'type' => $classInfo['type'],
                    'note' => $classInfo['note'],
                    'metadata' => $classInfo['metadata'] ? json_encode($classInfo['metadata']) : null,
                    'user_id' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            if (! empty($classifications)) {
                // Upsert: update type/note/metadata if classification already exists
                CallClassification::upsert(
                    $classifications,
                    ['call_log_id'], // unique key
                    ['type', 'note', 'metadata', 'updated_at'] // columns to update
                );
            }
        }

        // Dispatch analytics job for the device
        ProcessCallLogAnalytics::dispatch($dto->device->id);

        // Process escalations for the logs
        $allHashes = array_column($records, 'call_hash');
        $allLogs = CallLog::where('device_id', $dto->device->id)
            ->whereIn('call_hash', $allHashes)
            ->get();

        foreach ($allLogs as $callLog) {
            $direction = strtoupper((string) $callLog->direction);

            if (in_array($direction, ['MISSED', 'REJECTED', 'BLOCKED']) || ($direction === 'INCOMING' && $callLog->duration <= 0)) {
                ProcessMissedCallEscalationJob::dispatch($callLog->id);
            } elseif ($direction === 'OUTGOING' && $callLog->duration > 0) {
                AttemptEscalationResolutionJob::dispatch($callLog->id);
            }
        }

        return [
            'ingested' => count($records),
            'skipped' => $skippedCount,
            'skipped_slots' => $skippedSlots,
        ];
    }
}
