<?php

namespace Tests\Feature\Api\Admin;

use App\Domain\Agents\Models\Agent;
use App\Domain\Users\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeviceCodeTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_generate_device_code()
    {
        $admin = User::factory()->create();
        $agent = Agent::factory()->create();

        $response = $this->actingAs($admin)
            ->postJson('/api/v1/admin/devices/codes', [
                'agent_id' => $agent->id,
                'expires_in_hours' => 48,
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'code',
                    'expires_at',
                    'agent_id',
                ],
            ]);

        $this->assertDatabaseHas('device_registration_codes', [
            'agent_id' => $agent->id,
        ]);
    }

    public function test_can_list_active_codes()
    {
        $admin = User::factory()->create();
        $agent = Agent::factory()->create();

        // Generate a code via endpoint (or factory if exists, but endpoint is what we are testing)
        $this->actingAs($admin)
            ->postJson('/api/v1/admin/devices/codes', [
                'agent_id' => $agent->id,
            ]);

        $response = $this->actingAs($admin)
            ->getJson('/api/v1/admin/devices/codes');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'code',
                        'expires_at',
                        'agent',
                    ],
                ],
            ]);
    }
}
