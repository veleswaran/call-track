<?php

declare(strict_types=1);

namespace App\Domain\Devices\DTOs;

use Illuminate\Http\Request;

readonly class ListDevicesDTO
{
    public function __construct(
        public int $page,
        public int $perPage,
        public ?string $search = null,
        public mixed $allowedAgentIds = null,
        public ?string $status = null,
        public ?string $syncStatus = null,
    ) {}

    public static function fromRequest(Request $request, mixed $allowedAgentIds = null): self
    {
        return new self(
            page: (int) $request->input('page', 1),
            perPage: (int) $request->input('per_page', 15),
            search: $request->input('search'),
            allowedAgentIds: $allowedAgentIds,
            status: $request->filled('status') && $request->input('status') !== 'all' ? $request->input('status') : null,
            syncStatus: $request->filled('sync_status') && $request->input('sync_status') !== 'all' ? $request->input('sync_status') : null,
        );
    }
}
