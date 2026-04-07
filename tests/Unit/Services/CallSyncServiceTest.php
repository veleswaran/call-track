<?php

namespace Tests\Unit\Services;

use App\Actions\Calls\IngestCallLogsAction;
use App\Actions\Devices\UpdateDeviceSyncStateAction;
use App\Domain\Calls\DTOs\SyncCallLogsDTO;
use App\Domain\Devices\Models\Device;
use App\Services\Calls\CallSyncService;
use Mockery;
use Tests\TestCase;

class CallSyncServiceTest extends TestCase
{
    public function test_it_delegates_ingestion_to_action()
    {
        $ingestAction = Mockery::mock(IngestCallLogsAction::class);
        $syncStateAction = Mockery::mock(UpdateDeviceSyncStateAction::class);
        $service = new CallSyncService($ingestAction, $syncStateAction);

        $device = new Device;
        $device->id = 1;

        $dto = new SyncCallLogsDTO(
            device: $device,
            logs: [],
            batteryLevel: 85,
        );

        // Sync state action: device, battery, app version (null when omitted on DTO)
        $syncStateAction->shouldReceive('execute')
            ->once()
            ->with($device, 85, null);

        $ingestAction->shouldReceive('execute')
            ->once()
            ->with($dto);

        $service->sync($dto);
    }
}
