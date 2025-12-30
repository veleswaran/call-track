<?php

declare(strict_types=1);

namespace App\Domain\Contacts\DTOs;

readonly class StoreContactDTO
{
    public function __construct(
        public string $name,
        public string $phoneNumber,
    ) {}
}
