<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Domain\Reports\Actions\GetAgentPerformanceAction;
use App\Domain\Reports\Actions\GetReportChartsAction;
use App\Domain\Reports\Actions\GetReportMetricsAction;
use App\Domain\Reports\DTOs\ReportFilterDTO;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ReportController extends Controller
{
    public function __construct(
        private readonly GetReportMetricsAction $getMetricsAction,
        private readonly GetReportChartsAction $getChartsAction,
        private readonly GetAgentPerformanceAction $getPerformanceAction,
    ) {}

    public function metrics(Request $request): JsonResponse
    {
        $filters = ReportFilterDTO::fromArray($request->all());
        $data = $this->getMetricsAction->execute($filters);
        
        return response()->json(['data' => $data]);
    }

    public function charts(Request $request): JsonResponse
    {
        $filters = ReportFilterDTO::fromArray($request->all());
        $data = $this->getChartsAction->execute($filters);

        return response()->json(['data' => $data]);
    }

    public function performance(Request $request): JsonResponse
    {
        $filters = ReportFilterDTO::fromArray($request->all());
        $data = $this->getPerformanceAction->execute($filters);

        return response()->json(['data' => $data]);
    }
}
