<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Actions\Auth\UpdateUserPasswordAction;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    public function updatePassword(Request $request, UpdateUserPasswordAction $action): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        /** @var \App\Domain\Users\Models\User $user */
        $user = $request->user();

        if (! Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => [__('The provided password does not match your current records.')],
            ]);
        }

        $action->execute($user, $validated['password']);

        return response()->json(['message' => 'Password updated successfully.']);
    }
}
