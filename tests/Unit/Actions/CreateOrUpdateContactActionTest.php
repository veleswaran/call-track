<?php

declare(strict_types=1);

namespace Tests\Unit\Actions;

use App\Actions\Contacts\CreateOrUpdateContactAction;
use App\Domain\Calls\Models\Contact;
use App\Domain\Contacts\DTOs\StoreContactDTO;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreateOrUpdateContactActionTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_a_new_contact(): void
    {
        $dto = new StoreContactDTO(
            name: 'John Doe',
            phoneNumber: '+1234567890'
        );

        $action = new CreateOrUpdateContactAction;
        $contact = $action->execute($dto);

        $this->assertInstanceOf(Contact::class, $contact);
        $this->assertEquals('John Doe', $contact->name);
        $this->assertEquals('+1234567890', $contact->phone_number);
        // Phone is normalized before hashing: +1234567890 → 1234567890
        $this->assertEquals(hash('sha256', '1234567890'), $contact->phone_hash);
    }

    public function test_it_updates_existing_contact_with_same_phone_hash(): void
    {
        $phoneNumber = '+1234567890';
        $phoneHash = hash('sha256', $phoneNumber);

        // Create existing contact
        // Phone is normalized before hashing: +1234567890 → 1234567890
        $existingContact = Contact::create([
            'name' => 'Old Name',
            'phone_number' => $phoneNumber,
            'phone_hash' => hash('sha256', '1234567890'),
        ]);

        $dto = new StoreContactDTO(
            name: 'Updated Name',
            phoneNumber: $phoneNumber
        );

        $action = new CreateOrUpdateContactAction;
        $contact = $action->execute($dto);

        // Should update, not create new
        $this->assertEquals($existingContact->id, $contact->id);
        $this->assertEquals('Updated Name', $contact->name);
        $this->assertEquals(1, Contact::count());
    }

    public function test_same_phone_creates_single_global_contact(): void
    {
        $phoneNumber = '+1234567890';

        $dto1 = new StoreContactDTO(
            name: 'First Name',
            phoneNumber: $phoneNumber
        );

        $dto2 = new StoreContactDTO(
            name: 'Updated Name',
            phoneNumber: $phoneNumber
        );

        $action = new CreateOrUpdateContactAction;
        $contact1 = $action->execute($dto1);
        $contact2 = $action->execute($dto2);

        // Should update same contact globally (not create separate)
        $this->assertEquals($contact1->id, $contact2->id);
        $this->assertEquals('Updated Name', $contact2->name);
        $this->assertEquals(1, Contact::count());
    }
}
