<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Services\Auth\TwoFactorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Validation\ValidationException;

class TwoFactorController extends Controller
{
    public function __construct(
        protected TwoFactorService $twoFactorService,
    ) {}

    public function enable(Request $request): JsonResponse
    {
        $secret = $this->twoFactorService->generateSecretKey();
        $qrCodeUrl = $this->twoFactorService->getQrCodeUrl($request->user(), $secret);

        return response()->json([
            'secret' => $secret,
            'qr_code_url' => $qrCodeUrl,
        ]);
    }

    public function confirm(Request $request): JsonResponse
    {
        $request->validate([
            'secret' => ['required', 'string'],
            'code' => ['required', 'string'],
        ]);

        if (! $this->twoFactorService->verify($request->secret, $request->code)) {
            throw ValidationException::withMessages([
                'code' => ['The provided two factor authentication code was invalid.'],
            ]);
        }

        $recoveryCodes = $this->twoFactorService->enable($request->user(), $request->secret);

        return response()->json([
            'message' => 'Two factor authentication enabled.',
            'recovery_codes' => $recoveryCodes,
        ]);
    }

    public function disable(Request $request): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $this->twoFactorService->disable($request->user());

        return response()->json(['message' => 'Two factor authentication disabled.']);
    }

    public function recoveryCodes(Request $request): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        if (! $request->user()->two_factor_secret) {
            return response()->json(['message' => 'Two factor authentication not enabled.'], 400);
        }

        // Return existing codes? Or regenerate? Usually generic "show" vs "regenerate".
        // For simplicity, let's regenerate.
        $codes = $this->twoFactorService->generateRecoveryCodes($request->user());

        return response()->json(['recovery_codes' => $codes]);
    }

    public function challenge(Request $request): JsonResponse
    {
        $request->validate([
            'code' => ['required', 'string'],
        ]);

        $userId = $request->session()->get('auth.2fa.id');

        if (! $userId) {
            return response()->json(['message' => 'Two factor authentication session expired.'], 401);
        }

        $user = \App\Domain\Users\Models\User::find($userId);

        if (! $user) {
            $request->session()->forget('auth.2fa.id');

            return response()->json(['message' => 'User not found.'], 401);
        }

        $valid = $this->twoFactorService->verify(
            Crypt::decryptString($user->two_factor_secret),
            $request->code
        );

        if (! $valid) {
            throw ValidationException::withMessages([
                'code' => ['The provided two factor authentication code was invalid.'],
            ]);
        }

        \Illuminate\Support\Facades\Auth::guard('web')->login($user);
        $request->session()->forget('auth.2fa.id');
        $request->session()->regenerate();

        return response()->json([
            'message' => 'Logged in successfully',
            'user' => $user,
        ]);
    }
}
