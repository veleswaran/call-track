<?php

declare(strict_types=1);

namespace App\Actions\Devices;

use App\Domain\Devices\Models\Device;

/**
 * Updates the battery level for a device.
 */
class UpdateDeviceBatteryLevelAction
{
    public function execute(Device $device, int $batteryLevel): void
    {
        $device->update(['battery_level' => $batteryLevel]);
    }
}
