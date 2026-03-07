<?php

declare(strict_types=1);

namespace App\Actions\Devices;

use App\Domain\Devices\Models\Device;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;

class FindStaleHeartbeatDevicesAction
{
    /**
     * @return Collection<int, Device>
     */
    public function execute(int $thresholdMinutes = 60): Collection
    {
        return Device::query()
            ->whereNotNull('fcm_token')
            ->whereHas('activeTokens') // Only notify devices that are still registered
            ->where('last_heartbeat_at', '<', Carbon::now()->subMinutes($thresholdMinutes))
            ->get();
    }
}
