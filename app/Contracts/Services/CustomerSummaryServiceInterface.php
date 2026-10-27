<?php

declare(strict_types=1);

namespace App\Contracts\Services;

use App\Domain\Reports\DTOs\CustomerSummaryFilterDTO;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface CustomerSummaryServiceInterface
{
    /**
     * Get paginated customer summary records.
     */
    public function getSummary(CustomerSummaryFilterDTO $filters): LengthAwarePaginator;

    /**
     * Get aggregate KPI metrics for customer summary.
     *
     * @return array<string, mixed>
     */
    public function getMetrics(CustomerSummaryFilterDTO $filters): array;
}
