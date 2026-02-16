<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Users\Actions;

use App\Domain\Users\Actions\SwitchUserRoleAction;
use App\Domain\Users\DTOs\SwitchUserRoleDTO;
use App\Domain\Users\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SwitchUserRoleActionTest extends TestCase
{
    use RefreshDatabase;

    protected SwitchUserRoleAction $action;

    protected function setUp(): void
    {
        parent::setUp();
        $this->action = new SwitchUserRoleAction;

        // Seed roles
        Role::create(['name' => 'super-admin', 'guard_name' => 'web']);
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        Role::create(['name' => 'manager', 'guard_name' => 'web']);
    }

    public function test_can_switch_user_role(): void
    {
        $user = User::factory()->create();
        $user->assignRole('manager');

        $dto = new SwitchUserRoleDTO($user->id, 'admin');

        $this->action->handle($dto);

        $this->assertTrue($user->refresh()->hasRole('admin'));
        $this->assertFalse($user->hasRole('manager'));
    }

    public function test_cannot_switch_role_of_super_admin(): void
    {
        $superAdmin = User::factory()->create();
        $superAdmin->assignRole('super-admin');

        $dto = new SwitchUserRoleDTO($superAdmin->id, 'manager');

        $this->expectException(ValidationException::class);

        $this->action->handle($dto);
    }
}
