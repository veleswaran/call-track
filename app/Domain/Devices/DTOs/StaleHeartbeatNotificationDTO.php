<?php

declare(strict_types=1);

namespace App\Domain\Devices\DTOs;

use App\Domain\Devices\Models\Device;

final class StaleHeartbeatNotificationDTO
{
    public function __construct(
        public readonly Device $device,
        public readonly string $messageTitle,
        public readonly string $messageBody,
    ) {}
}
