<?php

namespace Database\Factories;

use App\Domain\Calls\Models\Contact;
use App\Support\PhoneNormalizer;
use Illuminate\Database\Eloquent\Factories\Factory;

class ContactFactory extends Factory
{
    protected $model = Contact::class;

    public function definition(): array
    {
        $phone = PhoneNormalizer::normalize($this->faker->e164PhoneNumber);

        return [
            'name' => $this->faker->name,
            'phone_hash' => hash('sha256', $phone),
            'phone_number' => $phone, // Encrypted by cast
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
