<?php

declare(strict_types=1);

namespace App\Services;

use App\Contracts\Services\DashboardServiceContract;
use App\Domain\Dashboard\Actions\GetDashboardMetricsAction;
use App\Domain\Dashboard\DTOs\DashboardMetricsDTO;

/**
 * Dashboard service implementation
 */
final class DashboardService implements DashboardServiceContract
{
    public function __construct(
        private readonly GetDashboardMetricsAction $getDashboardMetricsAction,
    ) {}

    /**
     * Get aggregated dashboard metrics
     */
    public function getMetrics(): DashboardMetricsDTO
    {
        return $this->getDashboardMetricsAction->execute();
    }
}
