<?php

namespace Tests\Unit\Actions\Contacts;

use App\Actions\Contacts\UpdateContactAction;
use App\Domain\Calls\Models\Contact;
use App\Domain\Contacts\DTOs\StoreContactDTO;
use App\Support\PhoneNormalizer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UpdateContactActionTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_updates_a_contact()
    {
        $contact = Contact::factory()->create([
            'name' => 'Old Name',
            'phone_number' => PhoneNormalizer::normalize('+1234567890'),
        ]);

        $dto = new StoreContactDTO(
            name: 'New Name',
            phoneNumber: PhoneNormalizer::normalize('+0987654321'),
        );

        $action = new UpdateContactAction;
        $updatedContact = $action->execute($contact, $dto);

        $this->assertEquals('New Name', $updatedContact->name);
        $this->assertEquals('+0987654321', $updatedContact->phone_number);
        $this->assertEquals(hash('sha256', '+0987654321'), $updatedContact->phone_hash);
    }
}
