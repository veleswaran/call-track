<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Domain\Users\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ResetUserPasswordTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'super-admin', 'guard_name' => 'web']);
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        Role::create(['name' => 'manager', 'guard_name' => 'web']);
        Role::create(['name' => 'member', 'guard_name' => 'web']);
    }

    public function test_super_admin_can_reset_another_users_password(): void
    {
        $superAdmin = User::factory()->create();
        $superAdmin->assignRole('super-admin');

        $targetUser = User::factory()->create();
        $targetUser->assignRole('member');

        $response = $this->actingAs($superAdmin)
            ->putJson("/api/v1/admin/users/{$targetUser->id}/reset-password", [
                'password' => 'new-secure-password',
                'password_confirmation' => 'new-secure-password',
            ]);

        $response->assertOk();
        $this->assertTrue(Hash::check('new-secure-password', $targetUser->fresh()->password));
    }

    public function test_super_admin_can_reset_own_password(): void
    {
        $superAdmin = User::factory()->create();
        $superAdmin->assignRole('super-admin');

        $response = $this->actingAs($superAdmin)
            ->putJson("/api/v1/admin/users/{$superAdmin->id}/reset-password", [
                'password' => 'new-secure-password',
                'password_confirmation' => 'new-secure-password',
            ]);

        $response->assertOk();
        $this->assertTrue(Hash::check('new-secure-password', $superAdmin->fresh()->password));
    }

    public function test_admin_cannot_reset_another_users_password(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $targetUser = User::factory()->create();
        $targetUser->assignRole('member');

        $response = $this->actingAs($admin)
            ->putJson("/api/v1/admin/users/{$targetUser->id}/reset-password", [
                'password' => 'new-secure-password',
                'password_confirmation' => 'new-secure-password',
            ]);

        $response->assertForbidden();
    }

    public function test_password_reset_requires_confirmation_match(): void
    {
        $superAdmin = User::factory()->create();
        $superAdmin->assignRole('super-admin');

        $targetUser = User::factory()->create();
        $targetUser->assignRole('member');

        $response = $this->actingAs($superAdmin)
            ->putJson("/api/v1/admin/users/{$targetUser->id}/reset-password", [
                'password' => 'new-secure-password',
                'password_confirmation' => 'mismatched-password',
            ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('password');
    }

    public function test_password_reset_requires_minimum_length(): void
    {
        $superAdmin = User::factory()->create();
        $superAdmin->assignRole('super-admin');

        $targetUser = User::factory()->create();
        $targetUser->assignRole('member');

        $response = $this->actingAs($superAdmin)
            ->putJson("/api/v1/admin/users/{$targetUser->id}/reset-password", [
                'password' => 'short',
                'password_confirmation' => 'short',
            ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('password');
    }
}
