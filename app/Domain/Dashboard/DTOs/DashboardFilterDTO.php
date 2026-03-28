<?php

declare(strict_types=1);

namespace App\Domain\Dashboard\DTOs;

use App\Http\Requests\Admin\GetDashboardDataRequest;
use Carbon\Carbon;

/**
 * Data Transfer Object for dashboard filtering criteria
 */
final readonly class DashboardFilterDTO
{
    /**
     * @param  int[]|null  $allowedAgentIds
     */
    public function __construct(
        public ?array $allowedAgentIds = null,
        public ?Carbon $startDate = null,
        public ?Carbon $endDate = null,
    ) {}

    /**
     * Create from request and allowed agent IDs
     *
     * @param  int[]|null  $allowedAgentIds
     */
    public static function fromRequest(GetDashboardDataRequest $request, ?array $allowedAgentIds): self
    {
        return new self(
            allowedAgentIds: $allowedAgentIds,
            startDate: $request->filled('start_date') ? Carbon::parse($request->string('start_date')->toString()) : null,
            endDate: $request->filled('end_date') ? Carbon::parse($request->string('end_date')->toString()) : null,
        );
    }
}
