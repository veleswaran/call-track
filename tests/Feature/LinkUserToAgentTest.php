<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domain\Agents\Models\Agent;
use App\Domain\Users\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class LinkUserToAgentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Setup Roles
        Role::create(['name' => 'super-admin']);
        Role::create(['name' => 'admin']);
        Role::create(['name' => 'manager']);
        Role::create(['name' => 'member']);
    }

    public function test_admin_can_link_user_to_agent()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $user = User::factory()->create();
        $agent = Agent::factory()->create();

        $this->actingAs($admin)
            ->postJson("/api/v1/admin/agents/{$agent->id}/link-user", [
                'user_id' => $user->id,
            ])
            ->assertOk()
            ->assertJson(['message' => 'User linked successfully.']);

        $this->assertEquals($user->id, $agent->fresh()->user_id);
    }

    public function test_manager_cannot_link_user_to_agent()
    {
        $manager = User::factory()->create();
        $manager->assignRole('manager');

        $user = User::factory()->create();
        $agent = Agent::factory()->create();

        $this->actingAs($manager)
            ->postJson("/api/v1/admin/agents/{$agent->id}/link-user", [
                'user_id' => $user->id,
            ])
            ->assertForbidden();
    }

    public function test_cannot_link_user_already_linked_to_another_agent()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $user = User::factory()->create();
        $agent1 = Agent::factory()->create(['user_id' => $user->id]);
        $agent2 = Agent::factory()->create();

        $this->actingAs($admin)
            ->postJson("/api/v1/admin/agents/{$agent2->id}/link-user", [
                'user_id' => $user->id,
            ])
            ->assertStatus(422)
            ->assertJson(['message' => 'User is already linked to another agent.']);
    }

    public function test_validation_errors()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $agent = Agent::factory()->create();

        $this->actingAs($admin)
            ->postJson("/api/v1/admin/agents/{$agent->id}/link-user", [
                'user_id' => 9999, // Non-existent
            ])
            ->assertStatus(422)
            ->assertJsonStructure(['errors' => ['user_id']]);
    }
}
