<?php

declare(strict_types=1);

namespace App\Services\Calls;

use App\Actions\Calls\IngestCallLogsAction;
use App\Actions\Devices\UpdateDeviceSyncStateAction;
use App\Contracts\Services\CallSyncServiceInterface;
use App\Domain\Calls\DTOs\SyncCallLogsDTO;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CallSyncService implements CallSyncServiceInterface
{
    public function __construct(
        protected IngestCallLogsAction $ingestAction,
        protected UpdateDeviceSyncStateAction $updateSyncStateAction,
    ) {}

    public function sync(SyncCallLogsDTO $dto): array
    {
        Log::info("Syncing calls for device: {$dto->device->id}", [
            'count' => count($dto->logs),
            'battery_level' => $dto->batteryLevel,
            'app_version' => $dto->appVersion,
        ]);

        return DB::transaction(function () use ($dto): array {
            // Update heartbeat, battery, and app version in a single query
            $this->updateSyncStateAction->execute($dto->device, $dto->batteryLevel, $dto->appVersion);

            return $this->ingestAction->execute($dto);
        });
    }
}
