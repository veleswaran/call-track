<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Contracts\Services\DashboardServiceContract;
use App\Http\Controllers\Controller;
use App\Http\Resources\DashboardMetricsResource;
use Illuminate\Http\JsonResponse;

/**
 * Controller for admin dashboard endpoints
 */
final class DashboardController extends Controller
{
    public function __construct(
        private readonly DashboardServiceContract $dashboardService,
    ) {}

    /**
     * Get dashboard metrics
     */
    public function index(): JsonResponse
    {
        $metrics = $this->dashboardService->getMetrics();

        return response()->json([
            'data' => new DashboardMetricsResource($metrics),
        ]);
    }
}
