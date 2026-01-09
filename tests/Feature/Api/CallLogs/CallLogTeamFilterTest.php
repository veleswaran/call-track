<?php

namespace Tests\Feature\Api\CallLogs;

use App\Domain\Agents\Models\Agent;
use App\Domain\Calls\Models\CallLog;
use App\Domain\Devices\Models\Device;
use App\Domain\Teams\Models\Team;
use App\Domain\Users\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CallLogTeamFilterTest extends TestCase
{
    use RefreshDatabase;

    private User $manager;

    private Agent $managerAgent;

    private Team $teamA;

    private Team $teamB;

    private Agent $memberA;

    private Agent $memberB;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);

        // 1. Create Teams
        $this->teamA = Team::factory()->create(['name' => 'Team A']);
        $this->teamB = Team::factory()->create(['name' => 'Team B']);

        // 2. Create Manager (User + Agent)
        $this->manager = User::factory()->create();
        $this->manager->assignRole('agent');
        $this->managerAgent = Agent::factory()->create([
            'user_id' => $this->manager->id,
            'status' => 'active',
        ]);

        // Assign Manager to Team A
        $this->teamA->members()->attach($this->managerAgent->id, ['role' => 'MANAGER']);

        // 3. Create Team Members (Agents + Devices + Logs)
        $this->memberA = Agent::factory()->create(['status' => 'active']);
        $this->teamA->members()->attach($this->memberA->id, ['role' => 'MEMBER']);
        $deviceA = Device::factory()->create(['agent_id' => $this->memberA->id]);
        CallLog::factory()->create([
            'device_id' => $deviceA->id,
            'direction' => 'INCOMING',
        ]);

        $this->memberB = Agent::factory()->create(['status' => 'active']);
        $this->teamB->members()->attach($this->memberB->id, ['role' => 'MEMBER']);
        $deviceB = Device::factory()->create(['agent_id' => $this->memberB->id]);
        CallLog::factory()->create([
            'device_id' => $deviceB->id,
            'direction' => 'INCOMING',
        ]);
    }

    public function test_manager_can_filter_by_managed_team_id()
    {
        $response = $this->actingAs($this->manager)
            ->getJson("/api/v1/admin/call-logs?team_id={$this->teamA->id}");

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data'); // Sees memberA's log
    }

    public function test_manager_filtering_by_unmanaged_team_returns_empty()
    {
        // Manager filters by Team B (which they don't manage)
        // Access Scope allows (Own + Team A)
        // Filter expects (Team B)
        // Intersection = Empty
        $response = $this->actingAs($this->manager)
            ->getJson("/api/v1/admin/call-logs?team_id={$this->teamB->id}");

        $response->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }

    public function test_admin_can_filter_by_any_team()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        // Filter Team A
        $this->actingAs($admin)
            ->getJson("/api/v1/admin/call-logs?team_id={$this->teamA->id}")
            ->assertStatus(200)
            ->assertJsonCount(1, 'data'); // Member A

        // Filter Team B
        $this->actingAs($admin)
            ->getJson("/api/v1/admin/call-logs?team_id={$this->teamB->id}")
            ->assertStatus(200)
            ->assertJsonCount(1, 'data'); // Member B
    }
}
