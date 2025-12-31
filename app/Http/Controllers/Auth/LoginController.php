<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class LoginController extends Controller
{
    public function __construct(
        protected \App\Contracts\Services\AuthServiceInterface $authService
    ) {}

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $result = $this->authService->attemptLogin($credentials);

        if (! $result->success) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        if ($result->requiresTwoFactor) {
            return response()->json([
                'requires_two_factor' => true,
            ]);
        }

        return response()->json([
            'message' => 'Logged in successfully',
            'user' => $result->user,
        ]);
    }

    public function logout(Request $request)
    {
        $this->authService->logout();

        return response()->json(['message' => 'Logged out successfully']);
    }
}
