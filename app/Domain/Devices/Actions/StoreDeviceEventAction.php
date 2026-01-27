<?php

declare(strict_types=1);

namespace App\Domain\Devices\Actions;

use App\Domain\Devices\DTOs\StoreDeviceEventDTO;
use App\Domain\Devices\Models\DeviceEvent;

class StoreDeviceEventAction
{
    /**
     * Store a device event with idempotency (upsert pattern).
     */
    public function execute(StoreDeviceEventDTO $dto): DeviceEvent
    {
        return DeviceEvent::firstOrCreate(
            [
                'device_id' => $dto->deviceId,
                'event_type' => $dto->eventType,
                'occurred_at' => $dto->occurredAt,
            ],
            [
                'payload' => $dto->payload,
            ]
        );
    }
}
