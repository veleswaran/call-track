<?php

declare(strict_types=1);

namespace Tests\Feature\Actions\Auth;

use App\Actions\Auth\AttemptTokenLoginAction;
use App\Domain\Auth\DTOs\AdminTokenLoginDTO;
use App\Domain\Users\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AttemptTokenLoginActionTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_authenticates_admin_user_successfully(): void
    {
        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $user = User::factory()->create([
            'password' => bcrypt('secret-password'),
        ]);
        $user->assignRole($adminRole);

        $dto = new AdminTokenLoginDTO(
            email: $user->email,
            password: 'secret-password',
            tokenName: 'test-token'
        );

        $action = app(AttemptTokenLoginAction::class);
        $result = $action->execute($dto);

        $this->assertNotEmpty($result->token);
        $this->assertSame('Bearer', $result->tokenType);
        $this->assertSame($user->id, $result->user->id);
    }

    public function test_it_throws_validation_exception_for_invalid_password(): void
    {
        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $user = User::factory()->create([
            'password' => bcrypt('secret-password'),
        ]);
        $user->assignRole($adminRole);

        $dto = new AdminTokenLoginDTO(
            email: $user->email,
            password: 'wrong-password'
        );

        $action = app(AttemptTokenLoginAction::class);

        $this->expectException(ValidationException::class);
        $action->execute($dto);
    }

    public function test_it_throws_validation_exception_for_non_admin_user(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('secret-password'),
        ]);

        $dto = new AdminTokenLoginDTO(
            email: $user->email,
            password: 'secret-password'
        );

        $action = app(AttemptTokenLoginAction::class);

        $this->expectException(ValidationException::class);
        $action->execute($dto);
    }
}
