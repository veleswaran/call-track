<?php

declare(strict_types=1);

namespace App\Actions\Devices;

use App\Domain\Devices\DTOs\RegisterDeviceData;
use App\Domain\Devices\Models\Device;
use App\Domain\Devices\Models\DeviceRegistrationCode;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RegisterDeviceWithCodeAction
{
    /**
     * @return array{device: Device, token: string}
     */
    public function execute(string $code, RegisterDeviceData $data): array
    {
        return DB::transaction(function () use ($code, $data) {
            $registrationCode = DeviceRegistrationCode::where('code', $code)
                ->whereNull('used_at')
                ->where('expires_at', '>', now())
                ->lockForUpdate() // Prevent race conditions
                ->firstOrFail();

            /** @var Device $device */
            $device = Device::create([
                'name' => $data->name,
                'model' => $data->model,
                'os_version' => $data->osVersion,
                'app_version' => $data->appVersion,
                'agent_id' => $registrationCode->agent_id,
            ]);

            $plainTextToken = Str::random(60);

            $device->tokens()->create([
                'token' => hash('sha256', $plainTextToken), // Store hashed
                'device_name' => $data->name,
                'last_used_at' => null,
            ]);

            // Update code usage
            $registrationCode->update([
                'used_at' => now(),
                'used_by_device_id' => $device->id,
            ]);

            return [
                'device' => $device,
                'token' => $plainTextToken,
            ];
        });
    }
}
