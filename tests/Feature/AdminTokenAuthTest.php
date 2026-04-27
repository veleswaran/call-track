<?php

namespace Tests\Feature;

use App\Domain\Users\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminTokenAuthTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function admin_can_login_and_receive_bearer_token(): void
    {
        $adminRole = Role::query()->firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

        $user = User::factory()->create([
            'password' => bcrypt('password'),
        ]);
        $user->assignRole($adminRole);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'access_token',
                'token_type',
                'user' => ['id', 'email', 'roles'],
            ]);

        $this->assertNotEmpty($response->json('access_token'));
        $this->assertSame('Bearer', $response->json('token_type'));
    }

    #[Test]
    public function non_admin_cannot_login_for_admin_api_token(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('password'),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }
}
