<?php

declare(strict_types=1);

namespace App\Domain\Contacts\DTOs;

use Illuminate\Http\Request;

readonly class ListContactsDTO
{
    public function __construct(
        public int $page,
        public int $perPage,
        public ?string $search = null,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            page: (int) $request->input('page', 1),
            perPage: (int) min(100, (int) $request->input('per_page', 15)),
            search: $request->input('search'),
        );
    }
}
