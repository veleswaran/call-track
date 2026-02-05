<?php

declare(strict_types=1);

namespace Tests\Feature\RBAC;

use App\Domain\Agents\Models\Agent;
use App\Domain\Devices\Models\Device;
use App\Domain\Teams\Models\Team;
use App\Domain\Users\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class DeviceRBACTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Ensure roles exist
        Role::firstOrCreate(['name' => 'super-admin']);
        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'manager']);
        Role::firstOrCreate(['name' => 'member']);
    }

    public function test_admin_can_see_all_devices(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        Device::factory()->count(3)->create();

        $response = $this->actingAs($admin)->getJson('/api/v1/admin/devices');

        $response->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_manager_can_see_team_devices_only(): void
    {
        // Manager setup
        $managerUser = User::factory()->create();
        $managerUser->assignRole('manager');
        $managerAgent = Agent::factory()->create(['user_id' => $managerUser->id]);

        $team = Team::factory()->create();
        $team->members()->attach($managerAgent->id, ['role' => 'MANAGER']);

        // Member in same team
        $memberAgent = Agent::factory()->create();
        $team->members()->attach($memberAgent->id, ['role' => 'MEMBER']);
        $teamDevice = Device::factory()->create(['agent_id' => $memberAgent->id]);

        // Device from another team
        $otherDevice = Device::factory()->create();

        $response = $this->actingAs($managerUser)->getJson('/api/v1/admin/devices');

        $response->assertOk()
            ->assertJsonCount(1, 'data');

        $ids = $response->json('data.*.id');
        $this->assertContains($teamDevice->id, $ids);
        $this->assertNotContains($otherDevice->id, $ids);
    }

    public function test_member_can_see_own_devices_only(): void
    {
        // Member setup
        $memberUser = User::factory()->create();
        $memberUser->assignRole('member');
        $memberAgent = Agent::factory()->create(['user_id' => $memberUser->id]);

        $ownDevice = Device::factory()->create(['agent_id' => $memberAgent->id]);
        $otherDevice = Device::factory()->create();

        $response = $this->actingAs($memberUser)->getJson('/api/v1/admin/devices');

        $response->assertOk()
            ->assertJsonCount(1, 'data');

        $ids = $response->json('data.*.id');
        $this->assertContains($ownDevice->id, $ids);
        $this->assertNotContains($otherDevice->id, $ids);
    }
}
