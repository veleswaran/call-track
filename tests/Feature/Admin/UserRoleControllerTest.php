<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Domain\Users\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class UserRoleControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed roles
        Role::create(['name' => 'super-admin', 'guard_name' => 'web']);
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        Role::create(['name' => 'manager', 'guard_name' => 'web']);
        Role::create(['name' => 'member', 'guard_name' => 'web']);
    }

    public function test_super_admin_can_switch_any_user_role(): void
    {
        $superAdmin = User::factory()->create();
        $superAdmin->assignRole('super-admin');

        $targetUser = User::factory()->create();
        $targetUser->assignRole('manager');

        $response = $this->actingAs($superAdmin)
            ->putJson("/api/v1/admin/users/{$targetUser->id}/role", [
                'role' => 'admin',
            ]);

        $response->assertNoContent();
        $this->assertTrue($targetUser->refresh()->hasRole('admin'));
    }

    public function test_super_admin_cannot_be_switched(): void
    {
        $superAdmin = User::factory()->create();
        $superAdmin->assignRole('super-admin');

        $targetSuperAdmin = User::factory()->create();
        $targetSuperAdmin->assignRole('super-admin');

        $response = $this->actingAs($superAdmin)
            ->putJson("/api/v1/admin/users/{$targetSuperAdmin->id}/role", [
                'role' => 'admin',
            ]);

        // Should be forbidden by Policy
        $response->assertForbidden();
    }

    public function test_admin_can_switch_manager_to_member(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $targetUser = User::factory()->create();
        $targetUser->assignRole('manager');

        $response = $this->actingAs($admin)
            ->putJson("/api/v1/admin/users/{$targetUser->id}/role", [
                'role' => 'member',
            ]);

        $response->assertNoContent();
        $this->assertTrue($targetUser->refresh()->hasRole('member'));
    }

    public function test_admin_cannot_make_user_admin(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $targetUser = User::factory()->create();
        $targetUser->assignRole('manager');

        $response = $this->actingAs($admin)
            ->putJson("/api/v1/admin/users/{$targetUser->id}/role", [
                'role' => 'admin',
            ]);

        $response->assertForbidden();
    }

    public function test_admin_cannot_switch_other_admin(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $targetAdmin = User::factory()->create();
        $targetAdmin->assignRole('admin');

        $response = $this->actingAs($admin)
            ->putJson("/api/v1/admin/users/{$targetAdmin->id}/role", [
                'role' => 'manager',
            ]);

        $response->assertForbidden();
    }
}
