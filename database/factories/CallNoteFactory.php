<?php

namespace Database\Factories;

use App\Domain\Classification\Models\CallNote;
use Illuminate\Database\Eloquent\Factories\Factory;

class CallNoteFactory extends Factory
{
    protected $model = CallNote::class;

    public function definition(): array
    {
        return [
            'note' => $this->faker->sentence,
            'call_log_id' => \App\Domain\Calls\Models\CallLog::factory(),
            'user_id' => \App\Domain\Users\Models\User::factory(),
        ];
    }
}
