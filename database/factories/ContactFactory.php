<?php

namespace Database\Factories;

use App\Domain\Calls\Models\Contact;
use App\Domain\Devices\Models\Device;
use Illuminate\Database\Eloquent\Factories\Factory;

class ContactFactory extends Factory
{
    protected $model = Contact::class;

    public function definition(): array
    {
        $phone = $this->faker->e164PhoneNumber;
        
        return [
            'device_id' => Device::factory(),
            'name' => $this->faker->name,
            'phone_hash' => hash('sha256', $phone),
            'phone_number' => $phone, // Encrypted by cast
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
