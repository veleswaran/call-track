<?php

declare(strict_types=1);

namespace App\Services\Devices;

use App\Actions\Devices\ArchiveInactiveDevicesAction;
use App\Contracts\Services\DeviceManagementServiceInterface;

class DeviceManagementService implements DeviceManagementServiceInterface
{
    public function __construct(
        protected ArchiveInactiveDevicesAction $archiveAction
    ) {}

    /**
     * @inheritDoc
     */
    public function archiveInactiveDevices(int $days = 15): int
    {
        return $this->archiveAction->execute($days);
    }
}
