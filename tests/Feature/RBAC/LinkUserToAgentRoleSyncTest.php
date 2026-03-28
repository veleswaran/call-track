<?php

namespace Tests\Feature\RBAC;

use App\Domain\Agents\Models\Agent;
use App\Domain\Teams\Models\Team;
use App\Domain\Users\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LinkUserToAgentRoleSyncTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_linking_user_to_manager_agent_grants_manager_role()
    {
        // 1. Create Agent and make Manager of a Team
        $agent = Agent::factory()->create();
        $team = Team::factory()->create();
        $team->members()->attach($agent->id, ['role' => 'MANAGER']);

        // 2. Create User (no roles)
        $user = User::factory()->create();

        $admin = User::factory()->create();
        $admin->assignRole('admin');

        // 3. Link them via API
        $response = $this->actingAs($admin)->postJson("/api/v1/admin/agents/{$agent->id}/link-user", [
            'user_id' => $user->id,
        ]);

        $response->assertStatus(200);
        $this->assertTrue($user->refresh()->hasRole('manager'), 'User should inherit manager role from agent');
    }

    public function test_linking_user_to_member_agent_grants_member_role()
    {
        $agent = Agent::factory()->create();
        $team = Team::factory()->create();
        $team->members()->attach($agent->id, ['role' => 'MEMBER']);

        $user = User::factory()->create();

        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)->postJson("/api/v1/admin/agents/{$agent->id}/link-user", [
            'user_id' => $user->id,
        ]);

        $response->assertStatus(200);
        $this->assertTrue($user->refresh()->hasRole('member'), 'User should inherit member role from agent');
    }

    public function test_linking_admin_does_not_change_role()
    {
        $agent = Agent::factory()->create();
        $team = Team::factory()->create();
        $team->members()->attach($agent->id, ['role' => 'MEMBER']);

        $targetAdmin = User::factory()->create();
        $targetAdmin->assignRole('admin');

        $superAdmin = User::factory()->create();
        $superAdmin->assignRole('super-admin');

        $response = $this->actingAs($superAdmin)->postJson("/api/v1/admin/agents/{$agent->id}/link-user", [
            'user_id' => $targetAdmin->id,
        ]);

        $response->assertStatus(200);
        // Expect Admin role to be CHANGED to member
        $this->assertFalse($targetAdmin->refresh()->hasRole('admin'), 'Admin role should be removed');
        $this->assertTrue($targetAdmin->hasRole('member'), 'Admin should be demoted to Member');
    }

    public function test_linking_super_admin_does_not_change_role()
    {
        $agent = Agent::factory()->create();
        $team = Team::factory()->create();
        $team->members()->attach($agent->id, ['role' => 'MEMBER']);

        $targetSuperAdmin = User::factory()->create();
        $targetSuperAdmin->assignRole('super-admin');

        $response = $this->actingAs($targetSuperAdmin)->postJson("/api/v1/admin/agents/{$agent->id}/link-user", [
            'user_id' => $targetSuperAdmin->id,
        ]);

        $response->assertStatus(200);
        $this->assertTrue($targetSuperAdmin->refresh()->hasRole('super-admin'), 'Super Admin should stay Super Admin');
        $this->assertFalse($targetSuperAdmin->hasRole('member'), 'Super Admin should not be demoted');
    }
}
