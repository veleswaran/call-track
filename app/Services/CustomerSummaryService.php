<?php

declare(strict_types=1);

namespace App\Services;

use App\Contracts\Services\CustomerSummaryServiceInterface;
use App\Domain\Reports\Actions\GetCustomerSummaryAction;
use App\Domain\Reports\Actions\GetCustomerSummaryMetricsAction;
use App\Domain\Reports\DTOs\CustomerSummaryFilterDTO;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class CustomerSummaryService implements CustomerSummaryServiceInterface
{
    public function __construct(
        private readonly GetCustomerSummaryAction $getCustomerSummaryAction,
        private readonly GetCustomerSummaryMetricsAction $getCustomerSummaryMetricsAction,
    ) {}

    public function getSummary(CustomerSummaryFilterDTO $filters): LengthAwarePaginator
    {
        return $this->getCustomerSummaryAction->execute($filters);
    }

    /**
     * @return array<string, mixed>
     */
    public function getMetrics(CustomerSummaryFilterDTO $filters): array
    {
        return $this->getCustomerSummaryMetricsAction->execute($filters);
    }
}
