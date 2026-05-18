<?php

declare(strict_types=1);

namespace App\Contracts\Services;

interface DeviceManagementServiceInterface
{
    /**
     * Archive devices that have been inactive for more than a specified number of days.
     *
     * @param int $days
     * @return int
     */
    public function archiveInactiveDevices(int $days = 15): int;
}
