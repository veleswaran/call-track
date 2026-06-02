<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Admin;

use App\Domain\Devices\Models\Device;
use App\Domain\Users\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeviceSearchTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');
    }

    public function test_can_search_devices_by_app_version(): void
    {
        Device::factory()->create([
            'name' => 'Device A',
            'app_version' => '1.0.0',
        ]);
        Device::factory()->create([
            'name' => 'Device B',
            'app_version' => '2.0.0',
        ]);
        Device::factory()->create([
            'name' => 'Device C',
            'app_version' => '1.1.0',
        ]);

        // Search for '2.0'
        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/devices?search=2.0');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.device_name', 'Device B');
        $response->assertJsonPath('data.0.app_version', '2.0.0');

        // Search for '1.'
        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/devices?search=1.');
        $response->assertOk();
        $response->assertJsonCount(2, 'data');
        $names = collect($response->json('data'))->pluck('device_name')->toArray();
        $this->assertContains('Device A', $names);
        $this->assertContains('Device C', $names);

        // Search for '1.2'
        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/devices?search=1.2');
        $response->assertOk();
    }

    public function test_can_filter_devices_by_team_id(): void
    {
        // 1. Create Teams
        $teamA = \App\Domain\Teams\Models\Team::factory()->create(['name' => 'Team Alpha']);
        $teamB = \App\Domain\Teams\Models\Team::factory()->create(['name' => 'Team Beta']);

        // 2. Create Agents
        $agentA = \App\Domain\Agents\Models\Agent::factory()->create(['name' => 'Agent Alpha']);
        $agentB = \App\Domain\Agents\Models\Agent::factory()->create(['name' => 'Agent Beta']);

        // Attach agents to teams
        $teamA->members()->attach($agentA->id, ['role' => 'MEMBER']);
        $teamB->members()->attach($agentB->id, ['role' => 'MEMBER']);

        // 3. Create Devices
        $deviceA = Device::factory()->create([
            'name' => 'Device Alpha',
            'agent_id' => $agentA->id,
        ]);
        $deviceB = Device::factory()->create([
            'name' => 'Device Beta',
            'agent_id' => $agentB->id,
        ]);

        // Filter by Team Alpha
        $response = $this->actingAs($this->admin)
            ->getJson("/api/v1/admin/devices?team_id={$teamA->id}");

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.device_name', 'Device Alpha');
        $response->assertJsonPath('data.0.agent.name', 'Agent Alpha');
        $response->assertJsonPath('data.0.agent.teams.0.name', 'Team Alpha');

        // Filter by Team Beta
        $response = $this->actingAs($this->admin)
            ->getJson("/api/v1/admin/devices?team_id={$teamB->id}");

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.device_name', 'Device Beta');
        $response->assertJsonPath('data.0.agent.name', 'Agent Beta');
        $response->assertJsonPath('data.0.agent.teams.0.name', 'Team Beta');
    }
}
