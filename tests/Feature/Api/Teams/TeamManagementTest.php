<?php

namespace Tests\Feature\Api\Teams;

use App\Domain\Agents\Models\Agent;
use App\Domain\Teams\Models\Team;
use App\Domain\Users\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TeamManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_admin_can_create_team()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)->postJson('/api/v1/admin/teams', [
            'name' => 'Sales Team',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('teams', ['name' => 'Sales Team']);
    }

    public function test_admin_can_add_member_to_team()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $team = Team::create(['name' => 'Support Team']);
        $agent = Agent::factory()->create();

        $response = $this->actingAs($admin)->postJson("/api/v1/admin/teams/{$team->id}/members", [
            'agent_id' => $agent->id,
            'role' => 'MEMBER',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('team_members', [
            'team_id' => $team->id,
            'agent_id' => $agent->id,
            'role' => 'MEMBER',
        ]);
    }

    public function test_admin_can_assign_manager_to_team()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $team = Team::create(['name' => 'Dev Team']);
        $agent = Agent::factory()->create();

        $response = $this->actingAs($admin)->postJson("/api/v1/admin/teams/{$team->id}/members", [
            'agent_id' => $agent->id,
            'role' => 'MANAGER',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('team_members', [
            'team_id' => $team->id,
            'agent_id' => $agent->id,
            'role' => 'MANAGER',
        ]);
    }

    public function test_regular_agent_cannot_manage_teams()
    {
        $user = User::factory()->create();
        $user->assignRole('member'); // member role doesn't have team management permissions
        // Note: Agent role doesn't have team management permissions

        $response = $this->actingAs($user)->postJson('/api/v1/admin/teams', [
            'name' => 'Hacker Team',
        ]);

        $response->assertForbidden();
    }

    public function test_admin_can_remove_member_from_team()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $team = Team::create(['name' => 'Support Team']);
        $agent = Agent::factory()->create();

        // Add member first
        $team->members()->attach($agent->id, ['role' => 'MEMBER']);

        $response = $this->actingAs($admin)->deleteJson("/api/v1/admin/teams/{$team->id}/members/{$agent->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('team_members', [
            'team_id' => $team->id,
            'agent_id' => $agent->id,
        ]);
    }

    public function test_admin_can_update_member_role()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $team = Team::create(['name' => 'Marketing Team']);
        $agent = Agent::factory()->create();

        // Add member as MEMBER
        $team->members()->attach($agent->id, ['role' => 'MEMBER']);

        $response = $this->actingAs($admin)->patchJson("/api/v1/admin/teams/{$team->id}/members/{$agent->id}", [
            'role' => 'MANAGER',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('team_members', [
            'team_id' => $team->id,
            'agent_id' => $agent->id,
            'role' => 'MANAGER',
        ]);
    }

    public function test_admin_can_update_team_name()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $team = Team::create(['name' => 'Old Name']);

        $response = $this->actingAs($admin)->patchJson("/api/v1/admin/teams/{$team->id}", [
            'name' => 'New Name',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.name', 'New Name');
        $response->assertJsonPath('message', 'Team updated successfully.');
        $this->assertDatabaseHas('teams', ['id' => $team->id, 'name' => 'New Name']);
    }

    public function test_regular_user_cannot_update_team_name()
    {
        $user = User::factory()->create();
        $user->assignRole('member');

        $team = Team::create(['name' => 'Protected Team']);

        $response = $this->actingAs($user)->patchJson("/api/v1/admin/teams/{$team->id}", [
            'name' => 'Hacked Name',
        ]);

        $response->assertForbidden();
        $this->assertDatabaseHas('teams', ['id' => $team->id, 'name' => 'Protected Team']);
    }

    public function test_update_team_name_validates_uniqueness()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        Team::create(['name' => 'Existing Team']);
        $team = Team::create(['name' => 'Another Team']);

        $response = $this->actingAs($admin)->patchJson("/api/v1/admin/teams/{$team->id}", [
            'name' => 'Existing Team',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('name');
        $this->assertDatabaseHas('teams', ['id' => $team->id, 'name' => 'Another Team']);
    }
}
