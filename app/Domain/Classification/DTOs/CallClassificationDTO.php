<?php

declare(strict_types=1);

namespace App\Domain\Classification\DTOs;

readonly class CallClassificationDTO
{
    public function __construct(
        public int $callLogId,
        public int $adminUserId,
        public string $type, // BUSINESS, PERSONAL, IGNORED
        public ?string $reason = null,
    ) {}
}
