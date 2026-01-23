<?php

declare(strict_types=1);

namespace App\Domain\Devices\DTOs;

use Illuminate\Support\Carbon;

final readonly class StoreDeviceEventDTO
{
    public function __construct(
        public int $deviceId,
        public string $eventType,
        public ?array $payload,
        public Carbon $occurredAt,
    ) {}
}
