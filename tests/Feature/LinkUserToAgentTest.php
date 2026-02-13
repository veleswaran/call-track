<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domain\Agents\Models\Agent;
use App\Domain\Users\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class LinkUserToAgentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Setup Roles
        Role::create(['name' => 'super-admin']);
        Role::create(['name' => 'admin']);
        Role::create(['name' => 'manager']);
        Role::create(['name' => 'member']);
    }

    public function test_admin_can_link_user_to_agent()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $user = User::factory()->create();
        $agent = Agent::factory()->create();

        $this->actingAs($admin)
            ->postJson("/api/v1/admin/agents/{$agent->id}/link-user", [
                'user_id' => $user->id,
            ])
            ->assertOk()
            ->assertJson(['message' => 'User linked successfully.']);

        $this->assertEquals($user->id, $agent->fresh()->user_id);
    }

    public function test_manager_cannot_link_user_to_agent()
    {
        $manager = User::factory()->create();
        $manager->assignRole('manager');

        $user = User::factory()->create();
        $agent = Agent::factory()->create();

        $this->actingAs($manager)
            ->postJson("/api/v1/admin/agents/{$agent->id}/link-user", [
                'user_id' => $user->id,
            ])
            ->assertForbidden();
    }

    public function test_cannot_link_user_already_linked_to_another_agent()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $user = User::factory()->create();
        $agent1 = Agent::factory()->create(['user_id' => $user->id]);
        $agent2 = Agent::factory()->create();

        $this->actingAs($admin)
            ->postJson("/api/v1/admin/agents/{$agent2->id}/link-user", [
                'user_id' => $user->id,
            ])
            ->assertStatus(422)
            ->assertJson(['message' => 'User is already linked to another agent.']);
    }

    public function test_validation_errors()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $agent = Agent::factory()->create();

        $this->actingAs($admin)
            ->postJson("/api/v1/admin/agents/{$agent->id}/link-user", [
                'user_id' => 9999, // Non-existent
            ])
            ->assertStatus(422)
            ->assertJsonStructure(['errors' => ['user_id']]);
    }

    public function test_role_sync_on_link()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $team = \App\Domain\Teams\Models\Team::create(['name' => 'Test Team']);

        // Case 1: Agent with no team -> gets 'member'
        $user1 = User::factory()->create();
        $agent1 = Agent::factory()->create();
        $this->actingAs($admin)->postJson("/api/v1/admin/agents/{$agent1->id}/link-user", ['user_id' => $user1->id])->assertOk();
        $this->assertTrue($user1->fresh()->hasRole('member'));

        // Case 2: Agent in team as MEMBER -> gets 'member'
        $user2 = User::factory()->create();
        $agent2 = Agent::factory()->create();
        $team->members()->attach($agent2->id, ['role' => 'MEMBER']);
        $this->actingAs($admin)->postJson("/api/v1/admin/agents/{$agent2->id}/link-user", ['user_id' => $user2->id])->assertOk();
        $this->assertTrue($user2->fresh()->hasRole('member'));

        // Case 3: Agent in team as MANAGER -> gets 'manager'
        $user3 = User::factory()->create();
        $agent3 = Agent::factory()->create();
        $team->members()->attach($agent3->id, ['role' => 'MANAGER']);
        $this->actingAs($admin)->postJson("/api/v1/admin/agents/{$agent3->id}/link-user", ['user_id' => $user3->id])->assertOk();
        $this->assertTrue($user3->fresh()->hasRole('manager'));
    }

    public function test_role_sync_skips_admins()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $superAdmin = User::factory()->create();
        $superAdmin->assignRole('super-admin');

        $agent = Agent::factory()->create();

        $this->actingAs($admin)
            ->postJson("/api/v1/admin/agents/{$agent->id}/link-user", ['user_id' => $superAdmin->id])
            ->assertOk();

        // Role should still be super-admin, not member
        $this->assertTrue($superAdmin->fresh()->hasRole('super-admin'));
        $this->assertFalse($superAdmin->fresh()->hasRole('member'));
    }

    public function test_role_sync_agent_in_multiple_teams()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $team1 = \App\Domain\Teams\Models\Team::create(['name' => 'Team Manager']);
        $team2 = \App\Domain\Teams\Models\Team::create(['name' => 'Team Member']);

        $user = User::factory()->create();
        $agent = Agent::factory()->create();

        // Agent is manager in one team and member in another
        $team1->members()->attach($agent->id, ['role' => 'MANAGER']);
        $team2->members()->attach($agent->id, ['role' => 'MEMBER']);

        $this->actingAs($admin)
            ->postJson("/api/v1/admin/agents/{$agent->id}/link-user", ['user_id' => $user->id])
            ->assertOk();

        // Should have manager role because it's the higher role
        $this->assertTrue($user->fresh()->hasRole('manager'));
    }

    public function test_role_sync_admin_user()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $targetAdmin = User::factory()->create();
        $targetAdmin->assignRole('admin');

        $team = \App\Domain\Teams\Models\Team::create(['name' => 'Management Team']);
        $agent = Agent::factory()->create();
        $team->members()->attach($agent->id, ['role' => 'MANAGER']);

        $this->actingAs($admin)
            ->postJson("/api/v1/admin/agents/{$agent->id}/link-user", ['user_id' => $targetAdmin->id])
            ->assertOk();

        // Admin role should be REPLACED by Manager role
        $this->assertFalse($targetAdmin->fresh()->hasRole('admin'));
        $this->assertTrue($targetAdmin->fresh()->hasRole('manager'));
    }
}
