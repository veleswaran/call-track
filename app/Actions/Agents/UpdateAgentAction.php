<?php

declare(strict_types=1);

namespace App\Actions\Agents;

use App\Domain\Agents\DTOs\AgentData;
use App\Domain\Agents\Models\Agent;

class UpdateAgentAction
{
    public function execute(Agent $agent, AgentData $data): Agent
    {
        $agent->update([
            'name' => $data->name,
            'employee_code' => $data->employeeCode,
            'agent_status_id' => $data->agentStatusId,
        ]);

        return $agent;
    }
}
