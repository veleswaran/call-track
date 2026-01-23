<?php

declare(strict_types=1);

namespace App\Contracts\Services;

use App\Domain\Devices\DTOs\StoreDeviceEventDTO;
use App\Domain\Devices\Models\DeviceEvent;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface DeviceEventServiceInterface
{
    /**
     * Store a device event (idempotent).
     */
    public function storeEvent(StoreDeviceEventDTO $dto): DeviceEvent;

    /**
     * List events for a device with pagination.
     */
    public function getDeviceEvents(int $deviceId, int $perPage = 15): LengthAwarePaginator;
}
