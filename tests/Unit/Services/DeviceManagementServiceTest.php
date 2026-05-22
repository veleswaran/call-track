<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

use App\Actions\Devices\ArchiveInactiveDevicesAction;
use App\Services\Devices\DeviceManagementService;
use Mockery;
use Tests\TestCase;

class DeviceManagementServiceTest extends TestCase
{
    public function test_it_delegates_archiving_to_action()
    {
        $action = Mockery::mock(ArchiveInactiveDevicesAction::class);
        $service = new DeviceManagementService($action);

        $action->shouldReceive('execute')
            ->once()
            ->with(15)
            ->andReturn(5);

        $result = $service->archiveInactiveDevices(15);

        $this->assertEquals(5, $result);
    }
}
