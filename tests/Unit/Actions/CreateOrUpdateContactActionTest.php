<?php

declare(strict_types=1);

namespace Tests\Unit\Actions;

use App\Actions\Contacts\CreateOrUpdateContactAction;
use App\Domain\Calls\Models\Contact;
use App\Domain\Contacts\DTOs\StoreContactDTO;
use App\Domain\Devices\Models\Device;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreateOrUpdateContactActionTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_a_new_contact(): void
    {
        $device = Device::factory()->create();
        $dto = new StoreContactDTO(
            deviceId: $device->id,
            name: 'John Doe',
            phoneNumber: '+1234567890'
        );

        $action = new CreateOrUpdateContactAction;
        $contact = $action->execute($dto);

        $this->assertInstanceOf(Contact::class, $contact);
        $this->assertEquals('John Doe', $contact->name);
        $this->assertEquals('+1234567890', $contact->phone_number);
        $this->assertEquals($device->id, $contact->device_id);
        $this->assertEquals(hash('sha256', '+1234567890'), $contact->phone_hash);
    }

    public function test_it_updates_existing_contact_with_same_phone_hash(): void
    {
        $device = Device::factory()->create();
        $phoneNumber = '+1234567890';
        $phoneHash = hash('sha256', $phoneNumber);

        // Create existing contact
        $existingContact = Contact::create([
            'device_id' => $device->id,
            'name' => 'Old Name',
            'phone_number' => $phoneNumber,
            'phone_hash' => $phoneHash,
        ]);

        $dto = new StoreContactDTO(
            deviceId: $device->id,
            name: 'Updated Name',
            phoneNumber: $phoneNumber
        );

        $action = new CreateOrUpdateContactAction;
        $contact = $action->execute($dto);

        // Should update, not create new
        $this->assertEquals($existingContact->id, $contact->id);
        $this->assertEquals('Updated Name', $contact->name);
        $this->assertEquals(1, Contact::where('device_id', $device->id)->count());
    }

    public function test_it_creates_separate_contacts_for_different_devices(): void
    {
        $device1 = Device::factory()->create();
        $device2 = Device::factory()->create();
        $phoneNumber = '+1234567890';

        $dto1 = new StoreContactDTO(
            deviceId: $device1->id,
            name: 'John on Device 1',
            phoneNumber: $phoneNumber
        );

        $dto2 = new StoreContactDTO(
            deviceId: $device2->id,
            name: 'John on Device 2',
            phoneNumber: $phoneNumber
        );

        $action = new CreateOrUpdateContactAction;
        $contact1 = $action->execute($dto1);
        $contact2 = $action->execute($dto2);

        // Should create separate contacts for different devices
        $this->assertNotEquals($contact1->id, $contact2->id);
        $this->assertEquals(2, Contact::where('phone_hash', hash('sha256', $phoneNumber))->count());
    }
}
