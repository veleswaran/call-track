<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Contracts\Services\DashboardServiceContract;
use App\Domain\Dashboard\DTOs\DashboardFilterDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\GetDashboardDataRequest;
use App\Http\Resources\DashboardMetricsResource;
use Illuminate\Http\JsonResponse;

/**
 * Controller for admin dashboard endpoints
 */
final class DashboardController extends Controller
{
    public function __construct(
        private readonly DashboardServiceContract $dashboardService,
        private readonly \App\Domain\Auth\Actions\GetAgentAccessScopeAction $getAgentAccessScopeAction,
    ) {}

    /**
     * Get dashboard metrics
     */
    public function index(GetDashboardDataRequest $request): JsonResponse
    {
        /** @var \App\Domain\Users\Models\User $user */
        $user = $request->user();
        $allowedAgentIds = $this->getAgentAccessScopeAction->execute($user);

        $filter = DashboardFilterDTO::fromRequest($request, $allowedAgentIds);
        $metrics = $this->dashboardService->getMetrics($filter);

        return response()->json([
            'data' => new DashboardMetricsResource($metrics),
        ]);
    }

    /**
     * Get dashboard chart data
     */
    public function charts(GetDashboardDataRequest $request): JsonResponse
    {
        /** @var \App\Domain\Users\Models\User $user */
        $user = $request->user();
        $allowedAgentIds = $this->getAgentAccessScopeAction->execute($user);

        $filter = DashboardFilterDTO::fromRequest($request, $allowedAgentIds);
        $charts = $this->dashboardService->getCharts($filter);

        return response()->json([
            'data' => $charts->toArray(),
        ]);
    }
}
