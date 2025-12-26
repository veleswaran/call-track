<?php

declare(strict_types=1);

namespace App\Contracts\Services;

use App\Domain\Agents\DTOs\AgentData;
use App\Domain\Agents\Models\Agent;
use App\Domain\Devices\Models\Device;

interface AgentManagementServiceInterface
{
    public function createAgent(AgentData $data): Agent;

    public function updateAgent(Agent $agent, AgentData $data): Agent;

    public function assignDevice(Device $device, Agent $agent): Device;

    public function unassignDevice(Device $device): Device;
}
