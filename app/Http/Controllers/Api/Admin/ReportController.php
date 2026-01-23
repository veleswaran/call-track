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
    ) {}

    public function metrics(GetReportDataRequest $request): ReportMetricCollection
    {
        $filters = ReportFilterDTO::fromArray($request->validated());
        $data = $this->reportService->getMetrics($filters);

        return new ReportMetricCollection($data);
    }

    public function charts(GetReportDataRequest $request): ReportChartResource
    {
        $filters = ReportFilterDTO::fromArray($request->validated());
        $data = $this->reportService->getCharts($filters);

        return new ReportChartResource($data);
    }

    public function performance(GetReportDataRequest $request): AgentPerformanceCollection
    {
        $filters = ReportFilterDTO::fromArray($request->validated());
        $data = $this->reportService->getPerformance($filters);

        return new AgentPerformanceCollection($data);
    }
}
