<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Auth;

use App\Contracts\Services\TwoFactorServiceInterface;
use App\Domain\Auth\DTOs\TwoFactorChallengeDTO;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TwoFactorController extends Controller
{
    public function __construct(
        protected TwoFactorServiceInterface $twoFactorService,
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
            throw \Illuminate\Validation\ValidationException::withMessages([
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

        $codes = $this->twoFactorService->generateRecoveryCodes($request->user());

        return response()->json(['recovery_codes' => $codes]);
    }

    public function challenge(Request $request): JsonResponse
    {
        $request->validate([
            'code' => ['required', 'string'],
        ]);

        $dto = new TwoFactorChallengeDTO(
            code: $request->code,
            userId: $request->session()->get('auth.2fa.id')
        );

        $user = $this->twoFactorService->handleChallenge($dto);

        return response()->json([
            'message' => 'Logged in successfully',
            'user' => $user,
        ]);
    }
}
