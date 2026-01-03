<?php

namespace Tests\Feature\Admin;

use App\Domain\Calls\Models\Contact;
use App\Domain\Users\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContactControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Assuming Sanctum auth or similar, create an admin user
        $this->user = User::factory()->create();
        $this->actingAs($this->user, 'sanctum');
    }

    public function test_admin_can_update_contact()
    {
        $contact = Contact::factory()->create([
            'name' => 'Old Name',
            'phone_number' => '1234567890',
        ]);

        $response = $this->putJson("/api/v1/admin/contacts/{$contact->id}", [
            'name' => 'Updated Name',
            'phone_number' => '9876543210',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'name' => 'Updated Name',
                'phone_number' => '9876543210',
            ]);

        $this->assertDatabaseHas('contacts', [
            'id' => $contact->id,
            'name' => 'Updated Name',
            'phone_hash' => hash('sha256', '9876543210'),
        ]);
    }

    public function test_admin_can_delete_contact()
    {
        $contact = Contact::factory()->create();

        $response = $this->deleteJson("/api/v1/admin/contacts/{$contact->id}");

        $response->assertStatus(204);

        $this->assertDatabaseMissing('contacts', ['id' => $contact->id]);
    }
}
