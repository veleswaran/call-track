<?php

declare(strict_types=1);

namespace App\Actions\Agents;

use App\Actions\Audit\LogAuditEventAction;
use App\Domain\Agents\Models\Agent;
use App\Domain\Devices\Models\Device;

class AssignAgentToDeviceAction
{
    public function __construct(
        private readonly LogAuditEventAction $logAuditEvent
    ) {}

    public function execute(Device $device, Agent $agent): Device
    {
        $oldAgentId = $device->agent_id;

        // Log audit event before making the change
        $this->logAuditEvent->execute(
            $device,
            'device.agent_assigned',
            ['agent_id' => $oldAgentId],
            ['agent_id' => $agent->id]
        );

        $device->update(['agent_id' => $agent->id]);

        return $device;
    }
}
