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
    public function getMetrics(): DashboardMetricsDTO;

    /**
     * Get dashboard chart data
     */
    public function getCharts(): DashboardChartsDTO;
}
