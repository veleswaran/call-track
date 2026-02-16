<?php

namespace Tests\Feature;

use App\Domain\Users\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use PHPUnit\Framework\Attributes\Test;
use PragmaRX\Google2FA\Google2FA;
use Tests\TestCase;

class TwoFactorAuthTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function can_enable_two_factor(): void
    {
        $user = User::factory()->create();

        $response = $this->withHeaders([
            'Referer' => 'http://localhost:3000',
            'Accept' => 'application/json',
        ])
            ->actingAs($user)
            ->postJson('/api/v1/auth/two-factor/enable');

        $response->assertOk()
            ->assertJsonStructure(['secret', 'qr_code_url']);
    }

    #[Test]
    public function can_confirm_two_factor(): void
    {
        $user = User::factory()->create();
        $google2fa = new Google2FA;
        $secret = $google2fa->generateSecretKey();
        $code = $google2fa->getCurrentOtp($secret);

        $response = $this->withHeaders([
            'Referer' => 'http://localhost:3000',
            'Accept' => 'application/json',
        ])
            ->actingAs($user)
            ->postJson('/api/v1/auth/two-factor/confirm', [
                'secret' => $secret,
                'code' => $code,
            ]);

        $response->assertOk()
            ->assertJsonStructure(['recovery_codes']);

        $user->refresh();
        $this->assertNotNull($user->two_factor_secret);
        $this->assertNotNull($user->two_factor_confirmed_at);
        $this->assertEquals($secret, Crypt::decryptString($user->two_factor_secret));
    }

    public function test_login_intercept_and_challenge()
    {
        $user = User::factory()->create([
            'password' => bcrypt('password'),
        ]);

        // Manually enable 2FA
        $google2fa = new Google2FA;
        $secret = $google2fa->generateSecretKey();
        $user->forceFill([
            'two_factor_secret' => Crypt::encryptString($secret),
            'two_factor_confirmed_at' => now(),
        ])->save();

        // 1. Login attempt
        $response = $this->postJson('/login', [ // Assuming standard route
            'email' => $user->email,
            'password' => 'password',
        ]);

        // Should intercept
        $response->assertOk()
            ->assertJson(['requires_two_factor' => true]);

        // User should NOT be authenticated
        $this->assertGuest('web');

        // 2. Challenge
        $code = $google2fa->getCurrentOtp($secret);

        // Session needs to be maintained. in tests, it usually is.
        // But we need to check if session has 'auth.2fa.id'.

        $response = $this->withHeaders(['Referer' => 'http://localhost:3000'])
            ->postJson('/api/v1/auth/two-factor/challenge', [
                'code' => $code,
            ]);

        $response->assertOk()
            ->assertJson(['message' => 'Logged in successfully']);

        $this->assertAuthenticatedAs($user, 'web');
    }
}
