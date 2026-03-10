<?php

declare(strict_types=1);

namespace App\Services;

use App\Contracts\Services\DashboardServiceContract;
use App\Domain\Dashboard\Actions\GetDashboardChartsAction;
use App\Domain\Dashboard\Actions\GetDashboardMetricsAction;
use App\Domain\Dashboard\DTOs\DashboardChartsDTO;
use App\Domain\Dashboard\DTOs\DashboardMetricsDTO;

/**
 * Dashboard service implementation
 */
final class DashboardService implements DashboardServiceContract
{
    public function __construct(
        private readonly GetDashboardMetricsAction $getDashboardMetricsAction,
        private readonly GetDashboardChartsAction $getDashboardChartsAction,
    ) {}

    /**
     * Get aggregated dashboard metrics
     */
    public function getMetrics(?array $allowedAgentIds = null, ?\Carbon\Carbon $startDate = null, ?\Carbon\Carbon $endDate = null): DashboardMetricsDTO
    {
        return $this->getDashboardMetricsAction->execute($allowedAgentIds, $startDate, $endDate);
    }

    /**
     * Get dashboard chart data
     */
    public function getCharts(?array $allowedAgentIds = null, ?\Carbon\Carbon $startDate = null, ?\Carbon\Carbon $endDate = null): DashboardChartsDTO
    {
        return $this->getDashboardChartsAction->execute($allowedAgentIds, $startDate, $endDate);
    }
}
