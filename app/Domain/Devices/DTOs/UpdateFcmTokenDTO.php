<?php

declare(strict_types=1);

namespace App\Domain\Devices\DTOs;

final class UpdateFcmTokenDTO
{
    public function __construct(
        public readonly int $deviceId,
        public readonly ?string $fcmToken,
    ) {}
}
