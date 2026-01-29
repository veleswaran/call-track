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
}
