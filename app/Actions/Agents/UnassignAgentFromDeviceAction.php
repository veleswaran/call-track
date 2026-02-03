<?php

declare(strict_types=1);

namespace App\Actions\Agents;

use App\Actions\Audit\LogAuditEventAction;
use App\Domain\Devices\Models\Device;

class UnassignAgentFromDeviceAction
{
    public function __construct(
        private readonly LogAuditEventAction $logAuditEvent
    ) {}

    public function execute(Device $device): Device
    {
        $oldAgentId = $device->agent_id;

        // Log audit event before making the change
        $this->logAuditEvent->execute(
            $device,
            'device.agent_unassigned',
            ['agent_id' => $oldAgentId],
            ['agent_id' => null]
        );

        $device->update(['agent_id' => null]);

        return $device;
    }
}
