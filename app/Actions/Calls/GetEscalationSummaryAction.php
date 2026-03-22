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
        $summaryDto = clone $dto;
        $summaryDto->status = null;

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
