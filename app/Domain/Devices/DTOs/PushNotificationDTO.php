<?php

declare(strict_types=1);

namespace App\Domain\Devices\DTOs;

use App\Domain\Devices\Models\Device;

final class PushNotificationDTO
{
    public function __construct(
        public readonly Device $device,
        public readonly string $title,
        public readonly string $body,
    ) {}
}
