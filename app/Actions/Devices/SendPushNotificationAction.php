<?php

declare(strict_types=1);

namespace App\Actions\Devices;

use App\Domain\Devices\DTOs\PushNotificationDTO;
use App\Domain\Devices\DTOs\StaleHeartbeatNotificationDTO;
use App\Domain\Devices\DTOs\UpdateFcmTokenDTO;
use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Contract\Messaging;
use Kreait\Firebase\Exception\Messaging\InvalidArgument;
use Kreait\Firebase\Exception\Messaging\NotFound;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;

class SendPushNotificationAction
{
    public function __construct(
        protected Messaging $messaging,
        protected ?UpdateDeviceFcmTokenAction $updateDeviceFcmTokenAction = null,
    ) {}

    public function execute(StaleHeartbeatNotificationDTO|PushNotificationDTO $dto): bool
    {
        $device = $dto->device;
        if (empty($device->fcm_token)) {
            Log::warning("Cannot send push notification: Device {$device->id} missing FCM token.");

            return false;
        }

        $title = $dto instanceof PushNotificationDTO ? $dto->title : $dto->messageTitle;
        $body = $dto instanceof PushNotificationDTO ? $dto->body : $dto->messageBody;

        try {
            $notification = Notification::create($title, $body);
            $message = CloudMessage::new()
                ->withToken($device->fcm_token)
                ->withNotification($notification);

            $this->messaging->send($message);

            Log::info("Successfully sent FCM push notification to device {$device->id}");

            return true;
        } catch (NotFound|InvalidArgument $e) {
            // Token is invalid/expired. Clear it to avoid repeated failures.
            Log::warning("Invalid FCM token detected for device {$device->id}; clearing token.", [
                'device_id' => $device->id,
                'error' => $e->getMessage(),
                'exception' => $e::class,
            ]);

            ($this->updateDeviceFcmTokenAction ?? app(UpdateDeviceFcmTokenAction::class))
                ->execute(new UpdateFcmTokenDTO(
                    deviceId: $device->id,
                    fcmToken: null,
                ));

            return false;
        } catch (\Throwable $e) {
            Log::error("Failed to send FCM push notification to device {$device->id}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'device_id' => $device->id,
            ]);

            return false;
        }
    }
}
