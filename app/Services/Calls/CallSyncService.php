<?php

declare(strict_types=1);

namespace App\Services\Calls;

use App\Actions\Calls\IngestCallLogsAction;
use App\Actions\Devices\UpdateDeviceBatteryLevelAction;
use App\Actions\Devices\UpdateDeviceHeartbeatAction;
use App\Contracts\Services\CallSyncServiceInterface;
use App\Domain\Calls\DTOs\SyncCallLogsDTO;
use Illuminate\Support\Facades\Log;

class CallSyncService implements CallSyncServiceInterface
{
    public function __construct(
        protected IngestCallLogsAction $ingestAction,
        protected UpdateDeviceBatteryLevelAction $updateBatteryAction,
        protected UpdateDeviceHeartbeatAction $updateHeartbeatAction,
    ) {}

    public function sync(SyncCallLogsDTO $dto): array
    {
        Log::info("Syncing calls for device: {$dto->device->id}", [
            'count' => count($dto->logs),
            'battery_level' => $dto->batteryLevel,
        ]);

        // Always update heartbeat on sync (even with empty logs)
        $this->updateHeartbeatAction->execute($dto->device);

        if ($dto->batteryLevel !== null) {
            $this->updateBatteryAction->execute($dto->device, $dto->batteryLevel);
        }

        return $this->ingestAction->execute($dto);
    }
}
