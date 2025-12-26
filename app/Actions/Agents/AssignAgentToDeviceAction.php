<?php

declare(strict_types=1);

namespace App\Actions\Agents;

use App\Domain\Agents\Models\Agent;
use App\Domain\Devices\Models\Device;

class AssignAgentToDeviceAction
{
    public function execute(Device $device, Agent $agent): Device
    {
        $device->update(['agent_id' => $agent->id]);
        return $device;
    }
}
