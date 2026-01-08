<?php

declare(strict_types=1);

namespace App\Services;

use App\Contracts\Services\ReportServiceInterface;
use App\Domain\Reports\Actions\GetAgentPerformanceAction;
use App\Domain\Reports\Actions\GetReportChartsAction;
use App\Domain\Reports\Actions\GetReportMetricsAction;
use App\Domain\Reports\DTOs\ReportFilterDTO;
use Carbon\Carbon;

final class ReportService implements ReportServiceInterface
{
    public function __construct(
        private readonly GetReportMetricsAction $getMetricsAction,
        private readonly GetReportChartsAction $getChartsAction,
        private readonly GetAgentPerformanceAction $getPerformanceAction,
    ) {}

    public function getMetrics(ReportFilterDTO $filters): array
    {
        return $this->getMetricsAction->execute($this->ensureDefaults($filters));
    }

    public function getCharts(ReportFilterDTO $filters): array
    {
        return $this->getChartsAction->execute($this->ensureDefaults($filters));
    }

    public function getPerformance(ReportFilterDTO $filters): array
    {
        return $this->getPerformanceAction->execute($this->ensureDefaults($filters));
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
            statuses: $filters->statuses,
            types: $filters->types,
            search: $filters->search,
        );
    }
}
