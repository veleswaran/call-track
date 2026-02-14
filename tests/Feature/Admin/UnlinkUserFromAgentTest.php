<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Domain\Agents\Models\Agent;
use App\Domain\Users\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UnlinkUserFromAgentTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create();
        \Spatie\Permission\Models\Role::create(['name' => 'super-admin', 'guard_name' => 'web']);
        $this->admin->assignRole('super-admin');
    }

    public function test_admin_can_unlink_user_from_agent(): void
    {
        Sanctum::actingAs($this->admin);

        /** @var User $user */
        $user = User::factory()->create();

        /** @var Agent $agent */
        $agent = Agent::factory()->create(['user_id' => $user->id]);

        $this->assertEquals($user->id, $agent->user_id);

        $response = $this->postJson("/api/v1/admin/agents/{$agent->id}/unlink-user", [
            'user_id' => $user->id,
        ]);

        $response->assertOk()
            ->assertJson([
                'message' => 'User unlinked successfully.',
            ]);

        $this->assertNull($agent->fresh()->user_id);
    }

    public function test_cannot_unlink_if_not_linked(): void
    {
        Sanctum::actingAs($this->admin);

        /** @var User $user */
        $user = User::factory()->create();

        /** @var Agent $agent */
        $agent = Agent::factory()->create(['user_id' => null]);

        $response = $this->postJson("/api/v1/admin/agents/{$agent->id}/unlink-user", [
            'user_id' => $user->id,
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'Agent is not linked to this user.',
            ]);
    }

    public function test_validation_requires_user_id(): void
    {
        Sanctum::actingAs($this->admin);

        /** @var Agent $agent */
        $agent = Agent::factory()->create();

        $response = $this->postJson("/api/v1/admin/agents/{$agent->id}/unlink-user", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['user_id']);
    }

    public function test_non_admin_cannot_unlink_user_from_agent(): void
    {
        // Create a non-admin user (e.g., manager)
        /** @var User $manager */
        $manager = User::factory()->create();
        \Spatie\Permission\Models\Role::create(['name' => 'manager', 'guard_name' => 'web']);
        $manager->assignRole('manager');

        Sanctum::actingAs($manager);

        /** @var User $user */
        $user = User::factory()->create();

        /** @var Agent $agent */
        $agent = Agent::factory()->create(['user_id' => $user->id]);

        $response = $this->postJson("/api/v1/admin/agents/{$agent->id}/unlink-user", [
            'user_id' => $user->id,
        ]);

        $response->assertForbidden();

        // Ensure link still exists
        $this->assertEquals($user->id, $agent->fresh()->user_id);
    }
}
