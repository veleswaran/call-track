<?php

declare(strict_types=1);

namespace App\Actions\Devices;

use App\Domain\Devices\Models\Device;
use Illuminate\Support\Carbon;

/**
 * Updates the device's sync state (heartbeat and optionally battery level) in a single query.
 * Called on every sync to track device activity efficiently.
 */
class UpdateDeviceSyncStateAction
{
    /**
     * Update the device's sync state in one database operation.
     */
    public function execute(Device $device, ?int $batteryLevel = null): void
    {
        $updates = [
            'last_heartbeat_at' => Carbon::now(),
        ];

        if ($batteryLevel !== null) {
            $updates['battery_level'] = $batteryLevel;
        }

        $device->update($updates);
    }
}
