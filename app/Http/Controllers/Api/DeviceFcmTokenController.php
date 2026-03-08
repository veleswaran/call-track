<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Contracts\Services\FcmNotificationServiceInterface;
use App\Domain\Devices\DTOs\UpdateFcmTokenDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreDeviceFcmTokenRequest;
use Illuminate\Http\JsonResponse;

class DeviceFcmTokenController extends Controller
{
    public function __construct(
        protected FcmNotificationServiceInterface $fcmService
    ) {}

    public function store(StoreDeviceFcmTokenRequest $request): JsonResponse
    {
        /** @var \App\Domain\Devices\Models\Device $device */
        $device = $request->attributes->get('device');

        $dto = new UpdateFcmTokenDTO(
            deviceId: $device->id,
            fcmToken: $request->validated('fcm_token')
        );

        $this->fcmService->updateFcmToken($dto);

        return response()->json([
            'message' => 'FCM token updated successfully',
        ]);
    }
}
