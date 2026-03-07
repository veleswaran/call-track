<?php

declare(strict_types=1);

namespace App\Actions\Devices;

use App\Domain\Devices\DTOs\UpdateFcmTokenDTO;
use App\Domain\Devices\Models\Device;

class UpdateDeviceFcmTokenAction
{
    public function execute(UpdateFcmTokenDTO $dto): void
    {
        $device = Device::findOrFail($dto->deviceId);

        if ($device->fcm_token !== $dto->fcmToken) {
            $device->update(['fcm_token' => $dto->fcmToken]);
        }
    }
}
