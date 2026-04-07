<?php

declare(strict_types=1);

namespace App\Actions\Devices;

use App\Domain\Devices\Models\Device;
use Illuminate\Support\Carbon;

/**
 * Updates the device's sync state (heartbeat, battery level, and app version) in a single query.
 * Called on every sync to track device activity efficiently.
 */
class UpdateDeviceSyncStateAction
{
    /**
     * Update the device's sync state in one database operation.
     */
    public function execute(Device $device, ?int $batteryLevel = null, ?string $appVersion = null): void
    {
        $updates = [
            'last_heartbeat_at' => Carbon::now(),
        ];

        if ($batteryLevel !== null) {
            $updates['battery_level'] = $batteryLevel;
        }

        if ($appVersion !== null) {
            $updates['app_version'] = $appVersion;
        }

        $device->update($updates);
    }
}
