<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Users\Actions;

use App\Actions\Auth\UpdateUserPasswordAction;
use App\Domain\Users\Actions\ResetUserPasswordAction;
use App\Domain\Users\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ResetUserPasswordActionTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_reset_user_password(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('old-password'),
        ]);

        $action = new ResetUserPasswordAction(new UpdateUserPasswordAction);
        $action->execute($user->id, 'brand-new-password');

        $this->assertTrue(Hash::check('brand-new-password', $user->fresh()->password));
    }
}
