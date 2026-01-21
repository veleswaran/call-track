<?php

declare(strict_types=1);

namespace App\Domain\Devices\Actions;

use App\Domain\Devices\Models\DeviceEvent;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ListDeviceEventsAction
{
    /**
     * List events for a device with pagination.
     */
    public function execute(int $deviceId, int $perPage = 15): LengthAwarePaginator
    {
        return DeviceEvent::where('device_id', $deviceId)
            ->orderBy('occurred_at', 'desc')
            ->paginate($perPage);
    }
}
