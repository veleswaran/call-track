<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Contracts\Services\ReportServiceInterface;
use App\Domain\Reports\DTOs\ReportFilterDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\GetReportDataRequest;
use App\Http\Resources\AgentPerformanceCollection;
use App\Http\Resources\ReportChartResource;
use App\Http\Resources\ReportMetricCollection;

final class ReportController extends Controller
{
    public function __construct(
        private readonly ReportServiceInterface $reportService,
        private readonly \App\Domain\Auth\Actions\GetAgentAccessScopeAction $getAgentAccessScopeAction,
    ) {}

    public function metrics(GetReportDataRequest $request): ReportMetricCollection
    {
        $filters = $this->buildScopedFilters($request);
        $data = $this->reportService->getMetrics($filters);

        return new ReportMetricCollection($data);
    }

    public function charts(GetReportDataRequest $request): ReportChartResource
    {
        $filters = $this->buildScopedFilters($request);
        $data = $this->reportService->getCharts($filters);

        return new ReportChartResource($data);
    }

    public function performance(GetReportDataRequest $request): AgentPerformanceCollection
    {
        $filters = $this->buildScopedFilters($request);
        $data = $this->reportService->getPerformance($filters);

        return new AgentPerformanceCollection($data);
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
        );
    }
}
