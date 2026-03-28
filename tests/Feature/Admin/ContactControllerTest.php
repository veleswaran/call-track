<?php

namespace Tests\Feature\Admin;

use App\Domain\Calls\Models\Contact;
use App\Domain\Users\Models\User;
use App\Support\PhoneNormalizer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContactControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();

        // Setup admin role
        \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'admin']);
        $this->user->assignRole('admin');

        $this->actingAs($this->user, 'sanctum');
    }

    public function test_can_list_contacts()
    {
        Contact::factory()->count(3)->create();

        $response = $this->getJson('/api/v1/admin/contacts');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_can_search_contacts()
    {
        Contact::factory()->create(['name' => 'John Doe', 'phone_number' => '1111111111']);
        Contact::factory()->create(['name' => 'Jane Smith', 'phone_number' => '2222222222']);

        $response = $this->getJson('/api/v1/admin/contacts?search=John');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'John Doe');
    }

    public function test_non_admin_cannot_list_contacts()
    {
        $nonAdmin = User::factory()->create();
        // No admin role

        $response = $this->actingAs($nonAdmin, 'sanctum')->getJson('/api/v1/admin/contacts');

        $response->assertStatus(403);
    }

    public function test_admin_can_update_contact()
    {
        $contact = Contact::factory()->create([
            'name' => 'Old Name',
            'phone_number' => PhoneNormalizer::normalize('1234567890'),
        ]);

        $response = $this->putJson("/api/v1/admin/contacts/{$contact->id}", [
            'name' => 'Updated Name',
            'phone_number' => PhoneNormalizer::normalize('9876543210'),
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'name' => 'Updated Name',
                'phone_number' => PhoneNormalizer::normalize('9876543210'),
            ]);

        $this->assertDatabaseHas('contacts', [
            'id' => $contact->id,
            'name' => 'Updated Name',
            'phone_hash' => hash('sha256', PhoneNormalizer::normalize('9876543210')),
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
