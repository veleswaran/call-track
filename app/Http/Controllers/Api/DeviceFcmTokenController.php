<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Contracts\Services\FcmNotificationServiceInterface;
use App\Domain\Devices\DTOs\UpdateFcmTokenDTO;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeviceFcmTokenController extends Controller
{
    public function __construct(
        protected FcmNotificationServiceInterface $fcmService
    ) {}

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'fcm_token' => ['required', 'string'],
        ]);

        /** @var \App\Domain\Devices\Models\Device $device */
        $device = $request->attributes->get('device');

        $dto = new UpdateFcmTokenDTO(
            deviceId: $device->id,
            fcmToken: $validated['fcm_token']
        );

        $this->fcmService->updateFcmToken($dto);

        return response()->json([
            'message' => 'FCM token updated successfully',
        ]);
    }
}
