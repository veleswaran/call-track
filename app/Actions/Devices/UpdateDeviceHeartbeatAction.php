<?php

declare(strict_types=1);

namespace App\Actions\Devices;

use App\Domain\Devices\Models\Device;
use Illuminate\Support\Carbon;

/**
 * Action to update the device's last heartbeat timestamp.
 * Called on every sync (even with empty logs) to track device activity.
 */
class UpdateDeviceHeartbeatAction
{
    /**
     * Update the device's last_heartbeat_at to the current timestamp.
     */
    public function execute(Device $device): void
    {
        $device->update([
            'last_heartbeat_at' => Carbon::now(),
        ]);
    }
}
