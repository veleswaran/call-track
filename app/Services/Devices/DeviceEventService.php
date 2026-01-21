<?php

declare(strict_types=1);

namespace App\Services\Devices;

use App\Contracts\Services\DeviceEventServiceInterface;
use App\Domain\Devices\Actions\ListDeviceEventsAction;
use App\Domain\Devices\Actions\StoreDeviceEventAction;
use App\Domain\Devices\DTOs\StoreDeviceEventDTO;
use App\Domain\Devices\Models\DeviceEvent;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class DeviceEventService implements DeviceEventServiceInterface
{
    public function __construct(
        protected StoreDeviceEventAction $storeDeviceEventAction,
        protected ListDeviceEventsAction $listDeviceEventsAction,
    ) {}

    public function storeEvent(StoreDeviceEventDTO $dto): DeviceEvent
    {
        return $this->storeDeviceEventAction->execute($dto);
    }

    public function getDeviceEvents(int $deviceId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->listDeviceEventsAction->execute($deviceId, $perPage);
    }
}
