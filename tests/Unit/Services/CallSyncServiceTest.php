<?php

namespace Tests\Unit\Services;

use App\Actions\Calls\IngestCallLogsAction;
use App\Actions\Devices\UpdateDeviceBatteryLevelAction;
use App\Actions\Devices\UpdateDeviceHeartbeatAction;
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
        $batteryAction = Mockery::mock(UpdateDeviceBatteryLevelAction::class);
        $heartbeatAction = Mockery::mock(UpdateDeviceHeartbeatAction::class);
        $service = new CallSyncService($ingestAction, $batteryAction, $heartbeatAction);

        $device = new Device;
        $device->id = 1;

        $dto = new SyncCallLogsDTO(
            device: $device,
            logs: []
        );

        // Heartbeat should be called on every sync
        $heartbeatAction->shouldReceive('execute')
            ->once()
            ->with($device);

        $ingestAction->shouldReceive('execute')
            ->once()
            ->with($dto);

        $service->sync($dto);
    }
}
