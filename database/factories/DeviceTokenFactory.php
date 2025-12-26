<?php

namespace Database\Factories;

use App\Domain\Devices\Models\Device;
use App\Domain\Devices\Models\DeviceToken;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class DeviceTokenFactory extends Factory
{
    protected $model = DeviceToken::class;

    public function definition(): array
    {
        return [
            'device_id' => Device::factory(),
            'token' => Str::random(60),
            'device_name' => $this->faker->words(3, true),
            'last_used_at' => now(),
        ];
    }
}
