<?php

declare(strict_types=1);

namespace App\Services\Devices;

use App\Actions\Devices\RegisterDeviceWithCodeAction;
use App\Contracts\Services\DeviceRegistrationServiceInterface;
use App\Domain\Devices\DTOs\RegisterDeviceData;

class DeviceRegistrationService implements DeviceRegistrationServiceInterface
{
    public function __construct(
        protected RegisterDeviceWithCodeAction $action
    ) {}

    public function registerDevice(string $code, RegisterDeviceData $data): array
    {
        $result = $this->action->execute($code, $data);

        return [
            'device_id' => $result['device']->id,
            'device' => $result['device'],
            'token' => $result['token'],
        ];
    }
}
