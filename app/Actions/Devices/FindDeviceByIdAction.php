<?php

declare(strict_types=1);

namespace App\Actions\Devices;

use App\Domain\Devices\Models\Device;

class FindDeviceByIdAction
{
    public function execute(int $deviceId): Device
    {
        return Device::findOrFail($deviceId);
    }
}
