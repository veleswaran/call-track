<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Devices\Models\DeviceStatus;
use Illuminate\Database\Eloquent\Factories\Factory;

class DeviceStatusFactory extends Factory
{
    protected $model = DeviceStatus::class;

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
