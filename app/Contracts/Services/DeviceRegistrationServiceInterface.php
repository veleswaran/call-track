<?php

declare(strict_types=1);

namespace App\Contracts\Services;

use App\Domain\Devices\DTOs\RegisterDeviceData;

interface DeviceRegistrationServiceInterface
{
    /**
     * @return array{device_id: int, device: \App\Domain\Devices\Models\Device, token: string}
     */
    public function registerDevice(string $code, RegisterDeviceData $data): array;
}
