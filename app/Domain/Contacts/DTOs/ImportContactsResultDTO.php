<?php

declare(strict_types=1);

namespace App\Domain\Contacts\DTOs;

readonly class ImportContactsResultDTO
{
    /**
     * @param  array<int, array{row: int, message: string}>  $errors
     */
    public function __construct(
        public int $totalRows,
        public int $created,
        public int $updated,
        public int $failed,
        public array $errors = [],
    ) {}
}
