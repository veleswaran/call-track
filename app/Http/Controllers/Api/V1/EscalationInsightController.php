<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Contracts\Services\EscalationServiceContract;
use App\Domain\Calls\DTOs\EscalationFilterDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\GetEscalationInsightsRequest;
use App\Http\Resources\EscalationResource;
use Illuminate\Http\JsonResponse;

class EscalationInsightController extends Controller
{
    public function __construct(
        private EscalationServiceContract $escalationService
    ) {}

    /**
     * Display a listing of call escalations with insights summary.
     */
    public function index(GetEscalationInsightsRequest $request): JsonResponse
    {
        $dto = EscalationFilterDTO::fromRequest($request);

        $escalations = $this->escalationService->getEscalationInsights($dto);
        $summary = $this->escalationService->getEscalationSummary($dto);

        return EscalationResource::collection($escalations)
            ->additional([
                'meta' => [
                    'summary' => $summary,
                ],
            ])
            ->response()
            ->setStatusCode(200);
    }
}
