<?php

namespace Database\Factories;

use App\Domain\Calls\Models\CallLog;
use App\Domain\Devices\Models\Device;
use Illuminate\Database\Eloquent\Factories\Factory;

class CallLogFactory extends Factory
{
    protected $model = CallLog::class;

    public function definition(): array
    {
        return [
            'device_id' => Device::factory(),
            'call_hash' => $this->faker->uuid,
            'phone_number_hash' => hash('sha256', \App\Support\PhoneNormalizer::normalize($this->faker->phoneNumber)),
            'direction' => $this->faker->randomElement(['incoming', 'outgoing', 'missed']),
            'duration' => $this->faker->numberBetween(0, 3600),
            'timestamp' => now()->toDateTimeString(),
            'created_at' => now(),
        ];
    }
}
