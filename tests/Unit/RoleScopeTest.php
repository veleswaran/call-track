<?php

namespace Tests\Unit;

use App\Domain\Agents\Models\Agent;
use App\Domain\Auth\Actions\GetAgentAccessScopeAction;
use App\Domain\Teams\Models\Team;
use App\Domain\Users\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleScopeTest extends TestCase
{
    use RefreshDatabase;

    public function test_manager_access_is_scoped_to_team_agents()
    {
        // 1. Create a Manager User and Agent
        $managerUser = User::factory()->create();
        $managerAgent = Agent::factory()->create(['user_id' => $managerUser->id]);

        // 2. Create another Agent NOT in a team
        $otherAgent = Agent::factory()->create();

        // 3. Create a Team and assign Manager context
        $team = Team::factory()->create();
        $team->members()->attach($managerAgent->id, ['role' => 'MANAGER']);

        // 4. Create a Team Agent
        $teamAgent = Agent::factory()->create();
        $team->members()->attach($teamAgent->id, ['role' => 'MEMBER']);

        $action = new GetAgentAccessScopeAction;
        $allowedIds = $action->execute($managerUser);

        $this->assertNotNull($allowedIds);
        $this->assertContains($managerAgent->id, $allowedIds);
        $this->assertContains($teamAgent->id, $allowedIds);
        $this->assertNotContains($otherAgent->id, $allowedIds);
    }

    public function test_admin_access_is_not_scoped()
    {
        // Create an Admin role if it doesn't exist (assuming spatie seeders or similar)
        // For simplicity in unit test, we can mock hasRole if needed,
        // but let's assume roles work if we use them.

        // We might need to seed roles first
        $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder']);

        $adminUser = User::factory()->create();
        $adminUser->assignRole('admin');

        $action = new GetAgentAccessScopeAction;
        $allowedIds = $action->execute($adminUser);

        $this->assertNull($allowedIds);
    }
}
