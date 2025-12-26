<?php

namespace Database\Factories;

use App\Domain\Calls\Models\CallLog;
use App\Domain\Classification\Models\CallClassification;
use App\Domain\Users\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class CallClassificationFactory extends Factory
{
    protected $model = CallClassification::class;

    public function definition(): array
    {
        return [
            'call_log_id' => CallLog::factory(),
            'user_id' => User::factory(),
            'type' => $this->faker->randomElement(['BUSINESS', 'PERSONAL', 'IGNORED']),
            'reason' => $this->faker->sentence,
        ];
    }
}
