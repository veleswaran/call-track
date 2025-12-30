<?php

declare(strict_types=1);

namespace App\Domain\Calls\DTOs;

use App\Http\Requests\Admin\IndexCallLogsRequest;

/**
 * Immutable DTO carrying pagination and filter inputs for listing call logs.
 */
final readonly class ListCallLogsDTO
{
    public function __construct(
        public int $page,
        public int $perPage,
        public ?int $deviceId = null,
        public ?int $agentId = null,
        public ?string $classification = null,
        public ?string $callType = null,
        public ?string $dateFrom = null,
        public ?string $dateTo = null,
        public ?string $search = null,
    ) {}

    public static function fromRequest(IndexCallLogsRequest $request): self
    {
        $page = (int) ($request->integer('page') ?: 1);
        $perPage = (int) ($request->integer('per_page') ?: 15);

        return new self(
            page: $page,
            perPage: $perPage,
            deviceId: $request->integer('device_id') ?: null,
            agentId: $request->integer('agent_id') ?: null,
            classification: $request->string('classification')->toString() ?: null,
            callType: $request->string('call_type')->toString() ?: null,
            dateFrom: $request->string('date_from')->toString() ?: null,
            dateTo: $request->string('date_to')->toString() ?: null,
            search: $request->string('search')->toString() ?: null,
        );
    }
}
