<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domain\Teams\Models\Team;
use App\Domain\Users\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserCreationOrchestrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\RolePermissionSeeder::class);
    }

    public function test_can_create_user_only()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $payload = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ];

        $this->actingAs($admin)
            ->postJson('/api/v1/admin/users', $payload)
            ->assertStatus(201);

        $this->assertDatabaseHas('users', ['email' => 'john@example.com']);
        $user = User::where('email', 'john@example.com')->first();
        $this->assertNull($user->agent);
    }

    public function test_can_create_user_with_agent()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $payload = [
            'name' => 'Agent Doe',
            'email' => 'agent@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'is_agent' => true,
            'role' => 'member',
            'employee_code' => 'EMP001',
        ];

        $this->actingAs($admin)
            ->postJson('/api/v1/admin/users', $payload)
            ->assertStatus(201);

        /** @var User $user */
        $user = User::where('email', 'agent@example.com')->first();
        $this->assertNotNull($user->agent);
        $this->assertEquals('EMP001', $user->agent->employee_code);
        $this->assertTrue($user->hasRole('member'));
    }

    public function test_can_create_user_with_agent_and_team()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $team = Team::factory()->create(['name' => 'Test Team']);

        $payload = [
            'name' => 'Manager Doe',
            'email' => 'manager@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'is_agent' => true,
            'role' => 'manager',
            'employee_code' => 'EMP002',
            'is_team' => true,
            'team_id' => $team->id,
        ];

        $this->actingAs($admin)
            ->postJson('/api/v1/admin/users', $payload)
            ->assertStatus(201);

        /** @var User $user */
        $user = User::where('email', 'manager@example.com')->first();
        $this->assertNotNull($user->agent);
        $this->assertTrue($user->hasRole('manager'));

        $this->assertDatabaseHas('team_members', [
            'team_id' => $team->id,
            'agent_id' => $user->agent->id,
            'role' => 'MANAGER',
        ]);
    }

    public function test_transaction_rolls_back_on_failure()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        // Mocking a failure mid-way is hard without more mocking,
        // but we can try to trigger a database error.
        // For example, sending a valid user but invalid team_id that fails during service layer.

        $payload = [
            'name' => 'Failing User',
            'email' => 'fail@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'is_agent' => true,
            'is_team' => true,
            'team_id' => 99999, // Should trigger exception in findTeam
        ];

        $this->actingAs($admin)
            ->postJson('/api/v1/admin/users', $payload)
            ->assertStatus(404);

        // User should NOT be created due to transaction rollback
        $this->assertDatabaseMissing('users', ['email' => 'fail@example.com']);
    }
}
