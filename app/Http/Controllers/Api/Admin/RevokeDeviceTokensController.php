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
    public function __invoke(\App\Domain\Devices\Models\Device $device): JsonResponse
    {
        $this->authorize('update', $device);

        $count = $this->service->revokeAllActiveTokens($device->id);

        return response()->json([
            'message' => 'Tokens revoked successfully.',
            'revoked_count' => $count,
        ]);
    }
}
