<?php

declare(strict_types=1);

namespace App\Contracts\Services;

use App\Domain\Reports\DTOs\ReportFilterDTO;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface CallInsightsServiceInterface
{
    public function getTopCallers(ReportFilterDTO $filters): LengthAwarePaginator;

    public function getAgentInsights(ReportFilterDTO $filters): array;

    public function getFrequentlyContacted(ReportFilterDTO $filters): LengthAwarePaginator;

    public function getLongestCalls(ReportFilterDTO $filters): LengthAwarePaginator;
}
