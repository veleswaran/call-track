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
            'token_hash' => hash('sha256', Str::random(60)),
            'device_name' => $this->faker->words(3, true),
            'issued_at' => now(),
            'expires_at' => now()->addDays(90),
            'revoked_at' => null,
            'last_used_at' => null,
        ];
    }

    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'expires_at' => now()->subDay(),
        ]);
    }

    public function revoked(): static
    {
        return $this->state(fn (array $attributes) => [
            'revoked_at' => now(),
        ]);
    }
}
