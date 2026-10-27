<?php

declare(strict_types=1);

namespace App\Services;

use App\Contracts\Services\CallInsightsServiceInterface;
use App\Domain\Reports\Actions\GetAgentInsightsAction;
use App\Domain\Reports\Actions\GetFrequentlyContactedAction;
use App\Domain\Reports\Actions\GetLongestCallsAction;
use App\Domain\Reports\Actions\GetTopCallersAction;
use App\Domain\Reports\DTOs\ReportFilterDTO;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class CallInsightsService implements CallInsightsServiceInterface
{
    public function __construct(
        private readonly GetTopCallersAction $getTopCallersAction,
        private readonly GetAgentInsightsAction $getAgentInsightsAction,
        private readonly GetFrequentlyContactedAction $getFrequentlyContactedAction,
        private readonly GetLongestCallsAction $getLongestCallsAction,
    ) {}

    public function getTopCallers(ReportFilterDTO $filters): LengthAwarePaginator
    {
        return $this->getTopCallersAction->execute($this->ensureDefaults($filters));
    }

    public function getAgentInsights(ReportFilterDTO $filters): array
    {
        return $this->getAgentInsightsAction->execute($this->ensureDefaults($filters));
    }

    public function getFrequentlyContacted(ReportFilterDTO $filters): LengthAwarePaginator
    {
        return $this->getFrequentlyContactedAction->execute($this->ensureDefaults($filters));
    }

    public function getLongestCalls(ReportFilterDTO $filters): LengthAwarePaginator
    {
        return $this->getLongestCallsAction->execute($this->ensureDefaults($filters));
    }

    private function ensureDefaults(ReportFilterDTO $filters): ReportFilterDTO
    {
        if ($filters->startDate !== null && $filters->endDate !== null) {
            return $filters;
        }

        return new ReportFilterDTO(
            startDate: $filters->startDate ?? Carbon::now()->startOfWeek(),
            endDate: $filters->endDate ?? Carbon::now()->endOfWeek(),
            agentIds: $filters->agentIds,
            teamIds: $filters->teamIds,
            statuses: $filters->statuses,
            outcomes: $filters->outcomes,
            types: $filters->types,
            search: $filters->search,
            allowedAgentIds: $filters->allowedAgentIds,
            contactFilter: $filters->contactFilter,
            simSlot: $filters->simSlot,
            sortBy: $filters->sortBy,
            sortOrder: $filters->sortOrder,
            perPage: $filters->perPage,
            page: $filters->page,
            forExport: $filters->forExport,
        );
    }
}
