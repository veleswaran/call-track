<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Contracts\Services\DeviceTokenServiceInterface;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class RevokeDeviceTokensController extends Controller
{
    public function __construct(
        protected DeviceTokenServiceInterface $service
    ) {}

    /**
     * Revoke all active tokens for the specified device.
     */
    public function __invoke(int $deviceId): JsonResponse
    {
        $count = $this->service->revokeAllActiveTokens($deviceId);

        return response()->json([
            'message' => 'Tokens revoked successfully.',
            'revoked_count' => $count,
        ]);
    }
}
