<?php

namespace Tests\Unit\Actions\Contacts;

use App\Actions\Contacts\DeleteContactAction;
use App\Domain\Calls\Models\Contact;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeleteContactActionTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_deletes_a_contact()
    {
        $contact = Contact::factory()->create();

        $action = new DeleteContactAction(
            new \App\Actions\Contacts\GetContactHashVariationsAction
        );
        $action->execute($contact);

        $this->assertDatabaseMissing('contacts', ['id' => $contact->id]);
    }
}
