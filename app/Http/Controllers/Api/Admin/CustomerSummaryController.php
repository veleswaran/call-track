<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Contracts\Services\CustomerSummaryServiceInterface;
use App\Domain\Auth\Actions\GetAgentAccessScopeAction;
use App\Domain\Reports\DTOs\CustomerSummaryFilterDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\GetReportDataRequest;
use App\Http\Resources\CustomerSummaryCollection;
use App\Http\Resources\CustomerSummaryMetricsResource;

final class CustomerSummaryController extends Controller
{
    public function __construct(
        private readonly CustomerSummaryServiceInterface $summaryService,
        private readonly GetAgentAccessScopeAction $getAgentAccessScopeAction,
    ) {}

    public function index(GetReportDataRequest $request): CustomerSummaryCollection
    {
        $filters = $this->buildScopedFilters($request);
        $data = $this->summaryService->getSummary($filters);

        return new CustomerSummaryCollection($data);
    }

    public function metrics(GetReportDataRequest $request): CustomerSummaryMetricsResource
    {
        $filters = $this->buildScopedFilters($request);
        $data = $this->summaryService->getMetrics($filters);

        return new CustomerSummaryMetricsResource($data);
    }

    private function buildScopedFilters(GetReportDataRequest $request): CustomerSummaryFilterDTO
    {
        /** @var \App\Domain\Users\Models\User $user */
        $user = $request->user();
        $allowedAgentIds = $this->getAgentAccessScopeAction->execute($user);

        $params = $request->validated();
        if ($allowedAgentIds !== null) {
            $params['allowed_agent_ids'] = $allowedAgentIds;
        }

        return CustomerSummaryFilterDTO::fromArray($params);
    }
}
