<?php

declare(strict_types=1);

namespace App\Actions\Calls;

use App\Domain\Calls\DTOs\EscalationFilterDTO;
use App\Domain\Calls\Models\CallEscalation;

class GetEscalationSummaryAction
{
    public function __construct(private readonly GetEscalationInsightsAction $insightsAction) {}

    public function execute(EscalationFilterDTO $dto): array
    {
        $baseQuery = CallEscalation::query();

        // Use a DTO without status to get all statuses for the summary
        $summaryDto = new EscalationFilterDTO(
            team_ids: $dto->team_ids,
            agent_id: $dto->agent_id,
            status: null,
            date_from: $dto->date_from,
            date_to: $dto->date_to,
            per_page: $dto->per_page,
            allowed_agent_ids: $dto->allowed_agent_ids,
            contact_filter: $dto->contact_filter,
            types: $dto->types,
            sim_slot: $dto->sim_slot,
        );

        $baseQuery = $this->insightsAction->applyFilters($baseQuery, $summaryDto);

        $statusCounts = (clone $baseQuery)
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $pending = $statusCounts->get('pending', 0);
        $unattended = $statusCounts->get('unattended', 0);
        $resolved = $statusCounts->get('resolved', 0);

        $total = $pending + $unattended + $resolved;
        $active = $pending + $unattended;

        return [
            'total_missed' => $total,
            'active_missed' => $active,
            'pending' => $pending,
            'unattended' => $unattended,
            'resolved' => $resolved,
        ];
    }
}
