<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Agents\Models\AgentStatus;
use Illuminate\Database\Eloquent\Factories\Factory;

class AgentStatusFactory extends Factory
{
    protected $model = AgentStatus::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->unique()->word,
            'color' => $this->faker->safeHexColor,
            'is_default' => false,
            'is_active' => true,
        ];
    }
}
