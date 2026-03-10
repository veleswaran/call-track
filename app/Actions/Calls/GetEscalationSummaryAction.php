<?php

declare(strict_types=1);

namespace App\Actions\Calls;

use App\Domain\Calls\DTOs\EscalationFilterDTO;
use App\Domain\Calls\Models\CallEscalation;

class GetEscalationSummaryAction
{
    private GetEscalationInsightsAction $insightsAction;

    public function __construct(GetEscalationInsightsAction $insightsAction)
    {
        $this->insightsAction = $insightsAction;
    }

    public function execute(EscalationFilterDTO $dto): array
    {
        $baseQuery = CallEscalation::query();

        // Use a DTO without status to get all statuses for the summary
        $summaryDto = clone $dto;
        $summaryDto->status = null;

        $baseQuery = $this->insightsAction->applyFilters($baseQuery, $summaryDto);

        $pending = (clone $baseQuery)->where('status', 'pending')->count();
        $unattended = (clone $baseQuery)->where('status', 'unattended')->count();
        $resolved = (clone $baseQuery)->where('status', 'resolved')->count();

        $total = $pending + $unattended + $resolved;

        return [
            'total_missed' => $total,
            'pending' => $pending,
            'unattended' => $unattended,
            'resolved' => $resolved,
        ];
    }
}
