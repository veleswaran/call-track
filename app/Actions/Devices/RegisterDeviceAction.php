<?php

declare(strict_types=1);

namespace App\Actions\Devices;

use App\Domain\Devices\DTOs\RegisterDeviceData;
use App\Domain\Devices\Models\Device;
use App\Domain\Devices\Models\DeviceToken;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RegisterDeviceAction
{
    /**
     * @return array{device: Device, token: string}
     */
    public function execute(RegisterDeviceData $data): array
    {
        return DB::transaction(function () use ($data) {
            /** @var Device $device */
            $device = Device::create([
                'name' => $data->name,
                'model' => $data->model,
                'os_version' => $data->osVersion,
                'app_version' => $data->appVersion,
            ]);

            $plainTextToken = Str::random(60);

            $device->tokens()->create([
                'token' => $plainTextToken,
                'device_name' => $data->name,
                'last_used_at' => null,
            ]);

            return [
                'device' => $device,
                'token' => $plainTextToken,
            ];
        });
    }
}
