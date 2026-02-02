<?php

declare(strict_types=1);

namespace App\Actions\Classification;

use App\Domain\Calls\Models\CallLog;
use App\Domain\Classification\DTOs\CallClassificationDTO;
use App\Domain\Classification\Models\CallClassification;
use App\Jobs\ProcessCallLogAnalytics;
use Illuminate\Support\Facades\DB;

class ClassifyCallAction
{
    public function execute(CallClassificationDTO $dto): void
    {
        DB::transaction(function () use ($dto) {
            CallClassification::updateOrCreate(
                ['call_log_id' => $dto->callLogId],
                [
                    'user_id' => $dto->adminUserId,
                    'agent_id' => $dto->agentId,
                    'type' => $dto->type,
                    'note' => $dto->note,
                    'metadata' => $dto->metadata,
                ]
            );
        });

        // Trigger analytics update for this specific call's device date
        $callLog = CallLog::find($dto->callLogId);
        if ($callLog) {
            ProcessCallLogAnalytics::dispatch($callLog->device_id);
        }
    }
}
