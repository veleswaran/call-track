<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Contracts\Services\CallInsightsServiceInterface;
use App\Domain\Auth\Actions\GetAgentAccessScopeAction;
use App\Domain\Reports\DTOs\ReportFilterDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\GetReportDataRequest;
use App\Http\Resources\AgentInsightsResource;
use App\Http\Resources\FrequentlyContactedCollection;
use App\Http\Resources\LongestCallsCollection;
use App\Http\Resources\TopCallersCollection;

final class CallInsightsController extends Controller
{
    public function __construct(
        private readonly CallInsightsServiceInterface $insightsService,
        private readonly GetAgentAccessScopeAction $getAgentAccessScopeAction,
    ) {}

    public function topCallers(GetReportDataRequest $request): TopCallersCollection
    {
        $filters = $this->buildScopedFilters($request);
        $data = $this->insightsService->getTopCallers($filters);

        return new TopCallersCollection($data);
    }

    public function agentInsights(GetReportDataRequest $request): AgentInsightsResource
    {
        $filters = $this->buildScopedFilters($request);
        $data = $this->insightsService->getAgentInsights($filters);

        return new AgentInsightsResource($data);
    }

    public function frequentlyContacted(GetReportDataRequest $request): FrequentlyContactedCollection
    {
        $filters = $this->buildScopedFilters($request);
        $data = $this->insightsService->getFrequentlyContacted($filters);

        return new FrequentlyContactedCollection($data);
    }

    public function longestCalls(GetReportDataRequest $request): LongestCallsCollection
    {
        $filters = $this->buildScopedFilters($request);
        $data = $this->insightsService->getLongestCalls($filters);

        return new LongestCallsCollection($data);
    }

    private function buildScopedFilters(GetReportDataRequest $request): ReportFilterDTO
    {
        /** @var \App\Domain\Users\Models\User $user */
        $user = $request->user();
        $allowedAgentIds = $this->getAgentAccessScopeAction->execute($user);

        $base = ReportFilterDTO::fromArray($request->validated());

        return new ReportFilterDTO(
            startDate: $base->startDate,
            endDate: $base->endDate,
            agentIds: $base->agentIds,
            teamIds: $base->teamIds,
            statuses: $base->statuses,
            outcomes: $base->outcomes,
            types: $base->types,
            search: $base->search,
            allowedAgentIds: $allowedAgentIds,
            contactFilter: $base->contactFilter,
            simSlot: $base->simSlot,
            sortBy: $base->sortBy,
            sortOrder: $base->sortOrder,
            perPage: $base->perPage,
            page: $base->page,
            forExport: $request->boolean('for_export'),
        );
    }
}
