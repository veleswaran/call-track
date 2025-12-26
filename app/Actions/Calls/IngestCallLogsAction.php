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

        foreach ($dto->logs as $log) {
            $records[] = [
                'device_id' => $dto->device->id,
                'call_hash' => $log->callHash,
                'phone_number_hash' => hash('sha256', $log->phoneNumber),
                'direction' => $log->direction,
                'duration' => $log->duration,
                'timestamp' => $log->timestamp,
                'created_at' => $now,
            ];
        }

        if (empty($records)) {
            return;
        }

        // Chunking for large batches
        foreach (array_chunk($records, 500) as $chunk) {
            CallLog::insertOrIgnore($chunk);
        }

        // Dispatch analytics job for the device
        // We trigger a re-calculation for the affected dates or just generic sync.
        // Passing device_id is safe.
        ProcessCallLogAnalytics::dispatch($dto->device->id);
    }
}
