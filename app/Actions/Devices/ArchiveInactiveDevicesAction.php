<?php

declare(strict_types=1);

namespace App\Actions\Devices;

use App\Domain\Devices\Models\Device;
use Illuminate\Support\Carbon;

class ArchiveInactiveDevicesAction
{
    public function execute(int $days = 15): int
    {
        $cutoff = Carbon::now()->subDays($days);

        return Device::query()
            ->where('status', '!=', 'archived')
            ->where(function ($query) use ($cutoff) {
                $query->where('last_heartbeat_at', '<', $cutoff)
                    ->orWhere(function ($sub) use ($cutoff) {
                        $sub->whereNull('last_heartbeat_at')
                            ->where('created_at', '<', $cutoff);
                    });
            })
            ->update(['status' => 'archived']);
    }
}
