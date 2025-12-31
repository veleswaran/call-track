<?php

namespace Tests\Feature;

use App\Domain\Users\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminUserTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Create an admin user to act as
        $this->admin = User::factory()->create();

        // Setup permission
        \Spatie\Permission\Models\Role::create(['name' => 'admin']);
        \Spatie\Permission\Models\Permission::create(['name' => 'manage users']);
        $this->admin->assignRole('admin');
        $this->admin->givePermissionTo('manage users');
    }

    public function test_can_list_users()
    {
        User::factory()->count(3)->create();

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/users');

        $response->assertOk()
            ->assertJsonCount(4, 'data'); // 3 + admin
    }

    public function test_can_create_admin_user()
    {
        $payload = [
            'name' => 'New Admin',
            'email' => 'newadmin@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $response = $this->actingAs($this->admin)->postJson('/api/v1/admin/users', $payload);

        $response->assertCreated()
            ->assertJsonPath('user.email', 'newadmin@example.com');

        $this->assertDatabaseHas('users', ['email' => 'newadmin@example.com']);
    }

    public function test_can_delete_user()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($this->admin)->deleteJson("/api/v1/admin/users/{$user->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    public function test_cannot_delete_self()
    {
        $response = $this->actingAs($this->admin)->deleteJson("/api/v1/admin/users/{$this->admin->id}");

        $response->assertStatus(403);
    }
}
