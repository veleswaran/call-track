<?php

namespace Tests\Feature\RBAC;

use App\Domain\Agents\Models\Agent;
use App\Domain\Teams\Models\Team;
use App\Domain\Users\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeamDataScopeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_admin_can_see_all_teams()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        Team::factory()->count(3)->create();

        $response = $this->actingAs($admin)->getJson('/api/v1/admin/teams');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_manager_can_only_see_managed_teams()
    {
        // 1. Create a Manager User + Agent
        $managerUser = User::factory()->create();
        $managerUser->assignRole('manager');
        $managerAgent = Agent::factory()->create(['user_id' => $managerUser->id]);

        // 2. Create Team A (Managed by Manager)
        $teamA = Team::factory()->create();
        $teamA->members()->attach($managerAgent->id, ['role' => 'MANAGER']);

        // 3. Create Team B (Not Managed)
        $teamB = Team::factory()->create();
        // Maybe member of Team B but not manager?
        // Or just unrelated.

        $this->actingAs($managerUser);

        $response = $this->getJson('/api/v1/admin/teams');

        $response->assertStatus(200) // Should be 200 now, was 403
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['id' => $teamA->id])
            ->assertJsonMissing(['id' => $teamB->id]);
    }

    public function test_member_cannot_access_teams_list()
    {
        $member = User::factory()->create();
        $member->assignRole('member');

        $response = $this->actingAs($member)->getJson('/api/v1/admin/teams');

        $response->assertStatus(403);
    }
}
