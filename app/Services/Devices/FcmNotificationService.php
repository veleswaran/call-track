<?php

declare(strict_types=1);

namespace App\Services\Devices;

use App\Actions\Devices\FindStaleHeartbeatDevicesAction;
use App\Actions\Devices\SendPushNotificationAction;
use App\Actions\Devices\UpdateDeviceFcmTokenAction;
use App\Actions\Settings\GetSystemSettingAction;
use App\Contracts\Services\FcmNotificationServiceInterface;
use App\Domain\Devices\DTOs\StaleHeartbeatNotificationDTO;
use App\Domain\Devices\DTOs\UpdateFcmTokenDTO;
use App\Domain\Devices\Models\Device;

class FcmNotificationService implements FcmNotificationServiceInterface
{
    public function __construct(
        protected UpdateDeviceFcmTokenAction $updateTokenAction,
        protected FindStaleHeartbeatDevicesAction $findStaleDevicesAction,
        protected SendPushNotificationAction $sendPushAction,
        protected GetSystemSettingAction $getSettingAction
    ) {}

    public function notifyStaleDevices(): int
    {
        $thresholdMinutes = (int) $this->getSettingAction->execute('heartbeat_threshold_minutes', 60);
        $title = (string) $this->getSettingAction->execute('fcm_stale_title', 'CallTrack needs your attention');
        $body = (string) $this->getSettingAction->execute('fcm_stale_body', 'Your device is going into sleep mode. Tap here to keep call tracking active.');

        $staleDevices = $this->findStaleDevicesAction->execute($thresholdMinutes);
        $sentCount = 0;

        foreach ($staleDevices as $device) {
            $dto = new StaleHeartbeatNotificationDTO(
                device: $device,
                messageTitle: $title,
                messageBody: $body
            );

            if ($this->sendPushAction->execute($dto)) {
                $sentCount++;
            }
        }

        return $sentCount;
    }

    public function forceNotifyDevice(int $deviceId, string $title, string $body): void
    {
        $device = Device::findOrFail($deviceId);

        $dto = new StaleHeartbeatNotificationDTO(
            device: $device,
            messageTitle: $title,
            messageBody: $body
        );

        $this->sendPushAction->execute($dto);
    }

    public function updateFcmToken(UpdateFcmTokenDTO $dto): void
    {
        $this->updateTokenAction->execute($dto);
    }
}
