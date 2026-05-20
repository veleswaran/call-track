<?php

declare(strict_types=1);

namespace App\Actions\Devices;

use App\Domain\Devices\Models\Device;
use Illuminate\Support\Carbon;

class ArchiveInactiveDevicesAction
{
    /**
     * Archive devices that have been inactive for a specified number of days.
     *
     * @return int The number of devices archived.
     */
    public function execute(int $days = 15): int
    {
        $cutoff = Carbon::now()->subDays($days);

        return Device::query()
            ->where('is_archived', false)
            ->where(function ($query) use ($cutoff) {
                $query->where('last_heartbeat_at', '<', $cutoff)
                    ->orWhere(function ($sub) use ($cutoff) {
                        $sub->whereNull('last_heartbeat_at')
                            ->where('updated_at', '<', $cutoff);
                    });
            })
            ->update(['is_archived' => true]);
    }
}
