<?php

declare(strict_types=1);

namespace App\Domain\Calls\DTOs;

readonly class CallLogData
{
    public function __construct(
        public string $callHash,
        public string $phoneNumber,
        public string $direction,
        public int $duration,
        public string $timestamp,
    ) {}
}
