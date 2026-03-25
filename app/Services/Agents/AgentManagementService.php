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

    public function getAgentsList(?array $allowedAgentIds = null, int $perPage = 20, ?string $search = null, ?int $teamId = null, string $sortBy = 'latest', ?int $agentStatusId = null): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        return Agent::with(['agentStatus'])
            ->withCount('devices')
            ->when($agentStatusId, function ($query) use ($agentStatusId) {
                $query->where('agent_status_id', $agentStatusId);
            })
            ->when($allowedAgentIds !== null, function ($query) use ($allowedAgentIds) {
                $query->whereIn('id', $allowedAgentIds);
            })
            ->when($teamId, function ($query) use ($teamId) {
                $query->whereHas('teams', function ($q) use ($teamId) {
                    $q->where('teams.id', $teamId);
                });
            })
            ->when($search, function ($query, $search) {
                $term = strtolower((string) $search);
                $query->where(function ($q) use ($term) {
                    $q->whereRaw('LOWER(name) LIKE ?', ["%{$term}%"])
                        ->orWhereRaw('LOWER(employee_code) LIKE ?', ["%{$term}%"]);
                });
            })
            ->when($sortBy === 'name', function ($query) {
                $query->orderBy('name', 'asc');
            }, function ($query) {
                $query->latest();
            })
            ->paginate($perPage);
    }
}
