<?php

namespace Tests\Feature\Admin;

use App\Domain\Agents\Models\Agent;
use App\Domain\Devices\Models\Device;
use App\Domain\Users\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AgentDeviceCountTest extends TestCase
{
    use RefreshDatabase;

    public function test_agent_list_includes_device_count()
    {
        $admin = User::factory()->create();
        $agentWithDevices = Agent::factory()->create(['name' => 'Agent A']);
        $agentWithoutDevices = Agent::factory()->create(['name' => 'Agent B']);

        Device::factory()->count(3)->create(['agent_id' => $agentWithDevices->id]);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/agents');

        $response->assertOk();

        $data = $response->json('data');

        $agentARecord = collect($data)->firstWhere('id', $agentWithDevices->id);
        $agentBRecord = collect($data)->firstWhere('id', $agentWithoutDevices->id);

        $this->assertEquals(3, $agentARecord['devices_count']);
        $this->assertEquals(0, $agentBRecord['devices_count']);
    }
}
