<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Auth;

use App\Contracts\Services\TokenAuthServiceInterface;
use App\Domain\Auth\DTOs\AdminTokenLoginDTO;
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
        $dto = new AdminTokenLoginDTO(
            email: $request->input('email'),
            password: $request->input('password'),
            tokenName: $request->input('token_name'),
            twoFactorCode: $request->input('two_factor_code')
        );

        $result = $this->tokenAuthService->attemptTokenLogin($dto);

        return response()->json([
            'access_token' => $result->token,
            'token_type' => $result->tokenType,
            'user' => new AdminUserResource($result->user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $this->tokenAuthService->revokeCurrentToken();

        return response()->json([
            'message' => 'Token revoked successfully',
        ]);
    }
}
