<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use Illuminate\Support\Facades\Auth;

class RevokeCurrentTokenAction
{
    /**
     * Revoke the current access token for the authenticated user.
     */
    public function execute(): void
    {
        $user = Auth::user();

        if ($user) {
            $user->currentAccessToken()->delete();
        }
    }
}
