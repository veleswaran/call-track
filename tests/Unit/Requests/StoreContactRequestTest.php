<?php

declare(strict_types=1);

namespace Tests\Unit\Requests;

use App\Domain\Devices\Models\Device;
use App\Domain\Users\Models\User;
use App\Http\Requests\StoreContactRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class StoreContactRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_authorizes_authenticated_users(): void
    {
        $user = User::factory()->create();
        $request = new StoreContactRequest;
        $request->setUserResolver(fn () => $user);

        $this->assertTrue($request->authorize());
    }

    public function test_it_denies_unauthenticated_users(): void
    {
        $request = new StoreContactRequest;
        $request->setUserResolver(fn () => null);

        $this->assertFalse($request->authorize());
    }

    public function test_it_validates_required_fields(): void
    {
        $request = new StoreContactRequest;
        $rules = $request->rules();

        $validator = Validator::make([], $rules);

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('device_id'));
        $this->assertTrue($validator->errors()->has('name'));
        $this->assertTrue($validator->errors()->has('phone_number'));
    }

    public function test_it_validates_device_exists(): void
    {
        $request = new StoreContactRequest;
        $rules = $request->rules();

        $validator = Validator::make([
            'device_id' => 99999,
            'name' => 'Test',
            'phone_number' => '+1234567890',
        ], $rules);

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('device_id'));
    }

    public function test_it_passes_validation_with_valid_data(): void
    {
        $device = Device::factory()->create();
        $request = new StoreContactRequest;
        $rules = $request->rules();

        $validator = Validator::make([
            'device_id' => $device->id,
            'name' => 'John Doe',
            'phone_number' => '+1234567890',
        ], $rules);

        $this->assertTrue($validator->passes());
    }

    public function test_it_validates_name_max_length(): void
    {
        $device = Device::factory()->create();
        $request = new StoreContactRequest;
        $rules = $request->rules();

        $validator = Validator::make([
            'device_id' => $device->id,
            'name' => str_repeat('a', 256), // Exceeds max 255
            'phone_number' => '+1234567890',
        ], $rules);

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('name'));
    }

    public function test_it_validates_phone_number_max_length(): void
    {
        $device = Device::factory()->create();
        $request = new StoreContactRequest;
        $rules = $request->rules();

        $validator = Validator::make([
            'device_id' => $device->id,
            'name' => 'Test',
            'phone_number' => str_repeat('1', 21), // Exceeds max 20
        ], $rules);

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('phone_number'));
    }
}
