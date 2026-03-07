<?php

declare(strict_types=1);

namespace App\Domain\Devices\DTOs;

final class SendPushNotificationDTO
{
    public function __construct(
        public readonly int $deviceId,
        public readonly ?string $title = null,
        public readonly ?string $body = null,
    ) {}
}
