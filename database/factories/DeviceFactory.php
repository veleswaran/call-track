<?php

namespace Database\Factories;

use App\Domain\Devices\Models\Device;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Domain\Devices\Models\Device>
 */
class DeviceFactory extends Factory
{
    protected $model = Device::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'device_uuid' => $this->faker->uuid,
            'name' => $this->faker->word,
            'model' => $this->faker->word,
            'os_version' => $this->faker->numerify('#.#'),
            'app_version' => $this->faker->numerify('#.#.#'),
            'status' => 'active',
        ];
    }
}
