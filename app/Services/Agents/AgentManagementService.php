<?php

declare(strict_types=1);

namespace App\Services\Agents;

use App\Actions\Agents\AssignAgentToDeviceAction;
use App\Actions\Agents\CreateAgentAction;
use App\Actions\Agents\UnassignAgentFromDeviceAction;
use App\Actions\Agents\UpdateAgentAction;
use App\Contracts\Services\AgentManagementServiceInterface;
use App\Domain\Agents\DTOs\AgentData;
use App\Domain\Agents\Models\Agent;
use App\Domain\Devices\Models\Device;

class AgentManagementService implements AgentManagementServiceInterface
{
    public function __construct(
        protected CreateAgentAction $createAgentAction,
        protected UpdateAgentAction $updateAgentAction,
        protected AssignAgentToDeviceAction $assignAction,
        protected UnassignAgentFromDeviceAction $unassignAction,
    ) {}

    public function createAgent(AgentData $data): Agent
    {
        return $this->createAgentAction->execute($data);
    }

    public function updateAgent(Agent $agent, AgentData $data): Agent
    {
        return $this->updateAgentAction->execute($agent, $data);
    }

    public function assignDevice(Device $device, int $agentId): Device
    {
        $agent = Agent::findOrFail($agentId); // Or validation handles ensure it exists

        return $this->assignAction->execute($device, $agent);
    }

    public function unassignDevice(Device $device): Device
    {
        return $this->unassignAction->execute($device);
    }

    public function getAgentsList(int $perPage = 20): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        return Agent::paginate($perPage);
    }
}
