<?php

namespace Database\Factories;

use App\Domain\Agents\Models\Agent;
use Illuminate\Database\Eloquent\Factories\Factory;

class AgentFactory extends Factory
{
    protected $model = Agent::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->name,
            'employee_code' => $this->faker->unique()->bothify('EMP-####'),
            'agent_status_id' => \App\Domain\Agents\Models\AgentStatus::factory(),
        ];
    }
}
