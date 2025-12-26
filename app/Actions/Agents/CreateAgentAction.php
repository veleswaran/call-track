<?php

declare(strict_types=1);

namespace App\Actions\Agents;

use App\Domain\Agents\DTOs\AgentData;
use App\Domain\Agents\Models\Agent;

class CreateAgentAction
{
    public function execute(AgentData $data): Agent
    {
        return Agent::create([
            'name' => $data->name,
            'employee_code' => $data->employeeCode,
            'status' => $data->status,
        ]);
    }
}
