<?php

namespace Tests\Feature\RBAC;

use App\Domain\Agents\Models\Agent;
use App\Domain\Teams\Models\Team;
use App\Domain\Users\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeamRoleSyncTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_assigning_manager_syncs_spatie_role()
    {
        $user = User::factory()->create();
        $agent = Agent::factory()->create(['user_id' => $user->id]);
        $team = Team::factory()->create();

        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin);

        // Action: Add as MANAGER
        // We use the Controller or Service directly? Let's use the Service for precision, or endpoint.
        // Let's use endpoint to simulate real flow.
        $response = $this->postJson("/api/v1/admin/teams/{$team->id}/members", [
            'agent_id' => $agent->id,
            'role' => 'MANAGER',
        ]);

        $response->assertStatus(200);

        // Assert Spatie Role
        $this->assertTrue($user->refresh()->hasRole('manager'), 'User should have manager role');
    }

    public function test_assigning_member_syncs_spatie_role()
    {
        $user = User::factory()->create();
        $agent = Agent::factory()->create(['user_id' => $user->id]);
        $team = Team::factory()->create();

        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin);

        $response = $this->postJson("/api/v1/admin/teams/{$team->id}/members", [
            'agent_id' => $agent->id,
            'role' => 'MEMBER',
        ]);

        $response->assertStatus(200);
        $this->assertTrue($user->refresh()->hasRole('member'), 'User should have member role');
    }

    public function test_updating_role_syncs_spatie_role()
    {
        $user = User::factory()->create();
        $agent = Agent::factory()->create(['user_id' => $user->id]);
        $team = Team::factory()->create();

        // Start as Member
        $team->members()->attach($agent->id, ['role' => 'MEMBER']);
        $user->assignRole('member');

        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $this->actingAs($admin);

        // Promote to MANAGER
        $response = $this->patchJson("/api/v1/admin/teams/{$team->id}/members/{$agent->id}", [
            'role' => 'MANAGER',
        ]);

        $response->assertStatus(200);
        $this->assertTrue($user->refresh()->hasRole('manager'), 'User should be promoted to manager');
        $this->assertFalse($user->hasRole('member'), 'User should no longer be just member');

        // Demote to MEMBER
        $response = $this->patchJson("/api/v1/admin/teams/{$team->id}/members/{$agent->id}", [
            'role' => 'MEMBER',
        ]);

        $response->assertStatus(200);
        $this->assertTrue($user->refresh()->hasRole('member'), 'User should be demoted to member');
        $this->assertFalse($user->hasRole('manager'));
    }
}
