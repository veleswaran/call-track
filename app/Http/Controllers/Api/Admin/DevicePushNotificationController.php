<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Contracts\Services\FcmNotificationServiceInterface;
use App\Contracts\Services\SettingsServiceInterface;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DevicePushNotificationController extends Controller
{
    public function __construct(
        protected FcmNotificationServiceInterface $fcmService,
        protected SettingsServiceInterface $settingsService
    ) {}

    public function store(Request $request, int $deviceId): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'body' => ['nullable', 'string'],
        ]);

        $defaultTitle = $this->settingsService->get('fcm_stale_title', 'CallTrack needs your attention');
        $defaultBody = $this->settingsService->get('fcm_stale_body', 'Your device is going into sleep mode. Tap here to keep call tracking active.');

        $this->fcmService->forceNotifyDevice(
            $deviceId,
            $validated['title'] ?? $defaultTitle,
            $validated['body'] ?? $defaultBody
        );

        return response()->json([
            'message' => 'Push notification queued for device',
        ]);
    }
}
