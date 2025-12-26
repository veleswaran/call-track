<?php

declare(strict_types=1);

namespace App\Actions\Agents;

use App\Domain\Devices\Models\Device;

class UnassignAgentFromDeviceAction
{
    public function execute(Device $device): Device
    {
        $device->update(['agent_id' => null]);

        return $device;
    }
}
