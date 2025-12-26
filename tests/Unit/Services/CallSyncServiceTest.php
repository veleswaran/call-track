<?php

namespace Tests\Unit\Services;

use App\Actions\Calls\IngestCallLogsAction;
use App\Domain\Calls\DTOs\SyncCallLogsDTO;
use App\Domain\Devices\Models\Device;
use App\Services\Calls\CallSyncService;
use Mockery;
use Tests\TestCase;

class CallSyncServiceTest extends TestCase
{
    public function test_it_delegates_ingestion_to_action()
    {
        $action = Mockery::mock(IngestCallLogsAction::class);
        $service = new CallSyncService($action);

        $device = new Device;
        $device->id = 1;

        $dto = new SyncCallLogsDTO(
            device: $device,
            logs: []
        );

        $action->shouldReceive('execute')
            ->once()
            ->with($dto);

        $service->sync($dto);
    }
}
