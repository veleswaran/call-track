<?php

declare(strict_types=1);

namespace App\Domain\Reports\DTOs;

use Carbon\Carbon;

final class CustomerSummaryFilterDTO
{
    /**
     * @param  int[]|null  $agentIds
     * @param  int[]|null  $teamIds
     * @param  string[]|null  $outcomes
     * @param  string[]|null  $types
     * @param  int[]|null  $allowedAgentIds
     */
    public function __construct(
        public readonly ?Carbon $startDate,
        public readonly ?Carbon $endDate,
        public readonly ?array $agentIds = null,
        public readonly ?array $teamIds = null,
        public readonly ?array $outcomes = null,
        public readonly ?array $types = null,
        public readonly ?string $search = null,
        public readonly ?array $allowedAgentIds = null,
        public readonly ?int $simSlot = null,
        public readonly string $tab = 'all',
        public readonly int $perPage = 15,
        public readonly ?int $page = null,
        public readonly ?string $sortBy = null,
        public readonly string $sortOrder = 'desc',
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            startDate: isset($data['start_date']) ? Carbon::parse($data['start_date']) : null,
            endDate: isset($data['end_date']) ? Carbon::parse($data['end_date']) : null,
            agentIds: isset($data['agent_ids']) ? array_map('intval', (array) $data['agent_ids']) : null,
            teamIds: isset($data['team_ids']) ? array_map('intval', (array) $data['team_ids']) : null,
            outcomes: isset($data['outcomes']) ? (array) $data['outcomes'] : null,
            types: isset($data['types']) ? (array) $data['types'] : null,
            search: isset($data['search']) ? (string) $data['search'] : null,
            allowedAgentIds: isset($data['allowed_agent_ids']) ? array_map('intval', (array) $data['allowed_agent_ids']) : null,
            simSlot: isset($data['sim_slot']) ? (int) $data['sim_slot'] : null,
            tab: (string) ($data['tab'] ?? 'all'),
            perPage: (int) ($data['per_page'] ?? 15),
            page: isset($data['page']) ? (int) $data['page'] : null,
            sortBy: isset($data['sort_by']) ? (string) $data['sort_by'] : null,
            sortOrder: strtolower((string) ($data['sort_order'] ?? 'desc')) === 'asc' ? 'asc' : 'desc',
        );
    }
}
