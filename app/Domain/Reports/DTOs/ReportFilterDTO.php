<?php

declare(strict_types=1);

namespace App\Domain\Reports\DTOs;

use Carbon\Carbon;

final class ReportFilterDTO
{
    public function __construct(
        public readonly ?Carbon $startDate,
        public readonly ?Carbon $endDate,
        public readonly ?array $agentIds = null,
        public readonly ?array $statuses = null,
        public readonly ?array $types = null,
        public readonly ?string $search = null,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            startDate: isset($data['start_date']) ? Carbon::parse($data['start_date']) : null,
            endDate: isset($data['end_date']) ? Carbon::parse($data['end_date']) : null,
            agentIds: $data['agent_ids'] ?? null,
            statuses: $data['statuses'] ?? null,
            types: $data['types'] ?? null,
            search: $data['search'] ?? null,
        );
    }
}
