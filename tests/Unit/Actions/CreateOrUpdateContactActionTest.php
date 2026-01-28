<?php

declare(strict_types=1);

namespace Tests\Unit\Actions;

use App\Actions\Contacts\CreateOrUpdateContactAction;
use App\Domain\Calls\Models\Contact;
use App\Domain\Contacts\DTOs\StoreContactDTO;
use App\Support\PhoneNormalizer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreateOrUpdateContactActionTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_a_new_contact(): void
    {
        $rawPhone = '+1234567890';
        $normalizedPhone = PhoneNormalizer::normalize($rawPhone);
        $dto = new StoreContactDTO(
            name: 'John Doe',
            phoneNumber: $rawPhone
        );

        $action = new CreateOrUpdateContactAction;
        $contact = $action->execute($dto);

        $this->assertInstanceOf(Contact::class, $contact);
        $this->assertEquals('John Doe', $contact->name);

        // Phone is stored in normalized international format
        $this->assertEquals($normalizedPhone, $contact->phone_number);

        // Hash is generated from the normalized phone number
        $this->assertEquals(hash('sha256', $normalizedPhone), $contact->phone_hash);
    }

    public function test_it_updates_existing_contact_with_same_phone_hash(): void
    {
        $rawPhone = '+1234567890';
        $normalizedPhone = PhoneNormalizer::normalize($rawPhone);

        $existingContact = Contact::create([
            'name' => 'Old Name',
            'phone_number' => $normalizedPhone,
            'phone_hash' => hash('sha256', $normalizedPhone),
        ]);

        $dto = new StoreContactDTO(
            name: 'Updated Name',
            phoneNumber: $rawPhone
        );

        $action = new CreateOrUpdateContactAction;
        $contact = $action->execute($dto);

        // Should update, not create new
        $this->assertEquals($existingContact->id, $contact->id);
        $this->assertEquals('Updated Name', $contact->name);
        $this->assertEquals($normalizedPhone, $contact->phone_number);
        $this->assertEquals(1, Contact::count());
    }

    public function test_same_phone_creates_single_global_contact(): void
    {
        $rawPhone = '+1234567890';
        $normalizedPhone = PhoneNormalizer::normalize($rawPhone);

        $dto1 = new StoreContactDTO(
            name: 'First Name',
            phoneNumber: $rawPhone
        );

        $dto2 = new StoreContactDTO(
            name: 'Updated Name',
            phoneNumber: $rawPhone
        );

        $action = new CreateOrUpdateContactAction;
        $contact1 = $action->execute($dto1);
        $contact2 = $action->execute($dto2);

        // Should update same contact globally (deduplicated by phone_hash)
        $this->assertEquals($contact1->id, $contact2->id);
        $this->assertEquals('Updated Name', $contact2->name);
        $this->assertEquals($normalizedPhone, $contact2->phone_number);
        $this->assertEquals(1, Contact::count());
    }
}
