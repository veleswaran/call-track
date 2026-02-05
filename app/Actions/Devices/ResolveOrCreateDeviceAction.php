<?php

declare(strict_types=1);

namespace App\Actions\Devices;

use App\Domain\Devices\DTOs\RegisterDeviceData;
use App\Domain\Devices\Models\Device;

/**
 * Resolves an existing device by device_uuid or creates a new one.
 * Ensures device identity is stable across re-registrations.
 */
class ResolveOrCreateDeviceAction
{
    /**
     * @return array{device: Device, wasCreated: bool}
     */
    public function execute(RegisterDeviceData $data, ?int $agentId = null): array
    {
        $deviceUuid = $data->deviceUuid;

        if ($deviceUuid === null) {
            $deviceUuid = \Illuminate\Support\Str::uuid()->toString();
        }

        $device = Device::where('device_uuid', $deviceUuid)->first();

        if ($device !== null) {
            // Update device metadata (name, model, versions may change)
            $device->update([
                'name' => $data->name,
                'model' => $data->model,
                'os_version' => $data->osVersion,
                'app_version' => $data->appVersion,
                'agent_id' => $agentId,
                'tracked_sim_slots' => $data->trackedSimSlots,
                'metadata' => $data->extra,
            ]);

            return [
                'device' => $device->fresh(),
                'wasCreated' => false,
            ];
        }

        // Create new device
        $device = Device::create([
            'device_uuid' => $deviceUuid,
            'name' => $data->name,
            'model' => $data->model,
            'os_version' => $data->osVersion,
            'app_version' => $data->appVersion,
            'agent_id' => $agentId,
            'tracked_sim_slots' => $data->trackedSimSlots,
            'metadata' => $data->extra,
        ]);

        return [
            'device' => $device,
            'wasCreated' => true,
        ];
    }
}
