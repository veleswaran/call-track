<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Auth;

use App\Contracts\Services\TokenAuthServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\AdminTokenLoginRequest;
use App\Http\Resources\AdminUserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminTokenAuthController extends Controller
{
    public function __construct(
        protected TokenAuthServiceInterface $tokenAuthService
    ) {}

    public function login(AdminTokenLoginRequest $request): JsonResponse
    {
        $result = $this->tokenAuthService->attemptTokenLogin($request->validated());

        return response()->json([
            'access_token' => $result['token'],
            'token_type' => $result['token_type'],
            'user' => new AdminUserResource($result['user']),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        /** @var \App\Domain\Users\Models\User $user */
        $user = $request->user();
        $this->tokenAuthService->revokeCurrentToken($user);

        return response()->json([
            'message' => 'Token revoked successfully',
        ]);
    }
}
