<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Auth\Actions;

use App\Domain\Agents\Models\Agent;
use App\Domain\Auth\Actions\GetAgentAccessScopeAction;
use App\Domain\Teams\Models\Team;
use App\Domain\Teams\Models\TeamMember;
use App\Domain\Users\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GetAgentAccessScopeActionTest extends TestCase
{
    use RefreshDatabase;

    private GetAgentAccessScopeAction $action;

    protected function setUp(): void
    {
        parent::setUp();
        $this->action = new GetAgentAccessScopeAction;
    }

    public function test_admin_has_full_access(): void
    {
        \Spatie\Permission\Models\Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $user = User::factory()->create();
        $user->assignRole('admin');

        $result = $this->action->execute($user);

        $this->assertNull($result);
    }

    public function test_non_agent_has_no_access(): void
    {
        $user = User::factory()->create();
        // and not an admin

        $result = $this->action->execute($user);

        $this->assertEquals([], $result);
    }

    public function test_member_agent_sees_only_self(): void
    {
        $user = User::factory()->create();
        $agent = Agent::factory()->create(['user_id' => $user->id]);

        $result = $this->action->execute($user);

        $this->assertEquals([$agent->id], $result);
    }

    public function test_manager_agent_sees_team_members(): void
    {
        $managerUser = User::factory()->create();
        $managerAgent = Agent::factory()->create(['user_id' => $managerUser->id]);

        $memberAgent1 = Agent::factory()->create();
        $memberAgent2 = Agent::factory()->create();

        $team = Team::factory()->create();

        TeamMember::factory()->create([
            'team_id' => $team->id,
            'agent_id' => $managerAgent->id,
            'role' => 'MANAGER',
        ]);

        TeamMember::factory()->create([
            'team_id' => $team->id,
            'agent_id' => $memberAgent1->id,
            'role' => 'MEMBER',
        ]);

        TeamMember::factory()->create([
            'team_id' => $team->id,
            'agent_id' => $memberAgent2->id,
            'role' => 'MEMBER',
        ]);

        $result = $this->action->execute($managerUser);

        $this->assertCount(3, $result);
        $this->assertContains($managerAgent->id, $result);
        $this->assertContains($memberAgent1->id, $result);
        $this->assertContains($memberAgent2->id, $result);
    }
}
