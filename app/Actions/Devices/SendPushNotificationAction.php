<?php

declare(strict_types=1);

namespace App\Actions\Devices;

use App\Domain\Devices\DTOs\StaleHeartbeatNotificationDTO;
use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Contract\Messaging;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;

class SendPushNotificationAction
{
    public function __construct(
        protected Messaging $messaging
    ) {}

    public function execute(StaleHeartbeatNotificationDTO $dto): bool
    {
        if (empty($dto->device->fcm_token)) {
            Log::warning("Cannot send push notification: Device {$dto->device->id} missing FCM token.");

            return false;
        }

        try {
            $notification = Notification::create($dto->messageTitle, $dto->messageBody);
            $message = CloudMessage::new()
                ->withToken($dto->device->fcm_token)
                ->withNotification($notification);

            $this->messaging->send($message);

            Log::info("Successfully sent FCM push notification to device {$dto->device->id}");

            return true;
        } catch (\Throwable $e) {
            Log::error("Failed to send FCM push notification to device {$dto->device->id}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return false;
        }
    }
}
