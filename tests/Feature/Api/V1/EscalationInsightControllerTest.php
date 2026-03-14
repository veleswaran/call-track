<?php

declare(strict_types=1);

namespace Tests\Feature\Api\V1;

use App\Domain\Users\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EscalationInsightControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Seed roles and permissions
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);
    }

    /**
     * Test that a user without the 'view escalations' permission cannot access the endpoint.
     */
    public function test_it_unauthorized_if_user_has_no_permission(): void
    {
        $user = User::factory()->create();
        // No role assigned, thus no 'view escalations' permission

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/admin/call-logs/escalations');

        $response->assertStatus(403);
        $response->assertJson([
            'message' => 'This action is unauthorized.',
        ]);
    }

    /**
     * Test that an admin user can access the endpoint.
     */
    public function test_it_authorized_if_user_has_admin_role(): void
    {
        $user = User::factory()->create();
        $user->assignRole('admin');

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/admin/call-logs/escalations');

        // It should return 200 OK. Even if there are no escalations, it should return an empty collection.
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data',
            'links',
            'meta' => [
                'summary' => [
                    'total_missed',
                    'pending',
                    'unattended',
                    'resolved',
                ],
                'current_page',
                'last_page',
            ],
        ]);
    }

    /**
     * Test that a manager user can access the endpoint.
     */
    public function test_it_authorized_if_user_has_manager_role(): void
    {
        $user = User::factory()->create();
        $user->assignRole('manager');

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/admin/call-logs/escalations');

        $response->assertStatus(200);
    }

    /**
     * Test that a regular member user (without the permission) cannot access the endpoint.
     */
    public function test_it_unauthorized_for_member_role(): void
    {
        $user = User::factory()->create();
        $user->assignRole('member');

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/admin/call-logs/escalations');

        $response->assertStatus(403);
    }
}
