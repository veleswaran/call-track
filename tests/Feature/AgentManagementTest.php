<?php

namespace Tests\Feature;

use App\Domain\Agents\Models\Agent;
use App\Domain\Devices\Models\Device;
use App\Domain\Users\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AgentManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_agent()
    {
        $admin = User::factory()->create();
        Sanctum::actingAs($admin, ['*']);

        $payload = [
            'name' => 'John Doe',
            'employee_code' => 'EMP-001',
            'status' => 'active',
        ];

        $response = $this->postJson('/api/v1/admin/agents', $payload);

        $response->assertCreated();
        $this->assertDatabaseHas('agents', [
            'name' => 'John Doe',
            'employee_code' => 'EMP-001',
        ]);
    }

    public function test_admin_can_update_agent()
    {
        $admin = User::factory()->create();
        Sanctum::actingAs($admin, ['*']);

        $agent = Agent::factory()->create(['name' => 'Old Name']);

        $payload = [
            'name' => 'New Name',
            'employee_code' => 'EMP-002',
            'status' => 'inactive',
        ];

        $response = $this->putJson("/api/v1/admin/agents/{$agent->id}", $payload);

        $response->assertOk();
        $this->assertDatabaseHas('agents', [
            'id' => $agent->id,
            'name' => 'New Name',
            'status' => 'inactive',
        ]);
    }

    public function test_admin_can_assign_agent_to_device()
    {
        $admin = User::factory()->create();
        Sanctum::actingAs($admin, ['*']);

        $device = Device::factory()->create();
        $agent = Agent::factory()->create();

        $response = $this->postJson("/api/v1/admin/devices/{$device->id}/assign-agent", [
            'agent_id' => $agent->id,
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('devices', [
            'id' => $device->id,
            'agent_id' => $agent->id,
        ]);
    }

    public function test_admin_can_unassign_agent_from_device()
    {
        $admin = User::factory()->create();
        Sanctum::actingAs($admin, ['*']);

        $agent = Agent::factory()->create();
        $device = Device::factory()->create(['agent_id' => $agent->id]);

        $response = $this->postJson("/api/v1/admin/devices/{$device->id}/unassign-agent");

        $response->assertOk();
        $this->assertDatabaseHas('devices', [
            'id' => $device->id,
            'agent_id' => null,
        ]);
    }

    public function test_guest_cannot_create_agent()
    {
        $response = $this->postJson('/api/v1/admin/agents', [
            'name' => 'Test',
            'status' => 'active',
        ]);

        $response->assertUnauthorized();
    }

    public function test_admin_can_list_agents()
    {
        $admin = User::factory()->create();
        $role = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $admin->assignRole($role);
        Sanctum::actingAs($admin, ['*']);

        Agent::factory()->count(3)->create();

        $response = $this->getJson('/api/v1/admin/agents');

        $response->assertOk();
        $response->assertJsonCount(3, 'data');
    }
}
