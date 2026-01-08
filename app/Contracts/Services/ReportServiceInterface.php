<?php

declare(strict_types=1);

namespace App\Contracts\Services;

use App\Domain\Reports\DTOs\ReportFilterDTO;

interface ReportServiceInterface
{
    public function getMetrics(ReportFilterDTO $filters): array;

    public function getCharts(ReportFilterDTO $filters): array;

    public function getPerformance(ReportFilterDTO $filters): array;
}
