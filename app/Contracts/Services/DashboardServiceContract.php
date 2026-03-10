<?php

declare(strict_types=1);

namespace App\Contracts\Services;

use App\Domain\Dashboard\DTOs\DashboardChartsDTO;
use App\Domain\Dashboard\DTOs\DashboardMetricsDTO;

/**
 * Contract for dashboard service
 */
interface DashboardServiceContract
{
    /**
     * Get aggregated dashboard metrics
     */
    public function getMetrics(?array $allowedAgentIds = null, ?\Carbon\Carbon $startDate = null, ?\Carbon\Carbon $endDate = null): DashboardMetricsDTO;

    /**
     * Get dashboard chart data
     */
    public function getCharts(?array $allowedAgentIds = null, ?\Carbon\Carbon $startDate = null, ?\Carbon\Carbon $endDate = null): DashboardChartsDTO;
}
