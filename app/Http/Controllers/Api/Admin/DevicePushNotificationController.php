<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Contracts\Services\FcmNotificationServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SendDevicePushNotificationRequest;
use Illuminate\Http\JsonResponse;

class DevicePushNotificationController extends Controller
{
    public function __construct(
        protected FcmNotificationServiceInterface $fcmService
    ) {}

    /**
     * Send a push notification to a specific device.
     */
    public function store(SendDevicePushNotificationRequest $request, int $deviceId): JsonResponse
    {
        $this->fcmService->forceNotifyDevice(
            $request->toDTO($deviceId)
        );

        return response()->json([
            'message' => 'Push notification queued for device',
        ]);
    }
}
