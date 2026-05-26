<?php

declare(strict_types=1);

namespace App\Contracts\Services;

interface DeviceManagementServiceInterface
{
    /**
     * Archive devices that have been inactive for more than a specified number of days.
     */
    public function archiveInactiveDevices(int $days = 15): int;
}
