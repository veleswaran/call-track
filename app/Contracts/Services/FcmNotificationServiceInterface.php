<?php

declare(strict_types=1);

namespace App\Contracts\Services;

use App\Domain\Devices\DTOs\SendPushNotificationDTO;
use App\Domain\Devices\DTOs\UpdateFcmTokenDTO;

interface FcmNotificationServiceInterface
{
    /**
     * Send push notifications to all devices with stale heartbeats.
     *
     * @return int Number of notifications sent
     */
    public function notifyStaleDevices(): int;

    /**
     * Force send a custom push notification to a specific device.
     * Falls back to system settings defaults when title/body are null.
     */
    public function forceNotifyDevice(SendPushNotificationDTO $dto): void;

    /**
     * Update the FCM token for a specific device.
     */
    public function updateFcmToken(UpdateFcmTokenDTO $dto): void;
}
