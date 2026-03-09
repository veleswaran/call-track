<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Contracts\Services\CallLogQueryServiceContract;
use App\Domain\Calls\DTOs\ListCallLogsDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexCallLogsRequest;
use App\Http\Resources\CallLogResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CallLogController extends Controller
{
    public function __construct(
        private readonly CallLogQueryServiceContract $service,
        private readonly \App\Domain\Auth\Actions\GetAgentAccessScopeAction $getAgentAccessScopeAction,
    ) {}

    /**
     * List all call logs
     */
    public function index(IndexCallLogsRequest $request): AnonymousResourceCollection
    {
        /** @var \App\Domain\Users\Models\User $user */
        $user = $request->user();

        // Resolve the access scope for this user
        $allowedAgentIds = $this->getAgentAccessScopeAction->execute($user);

        // Build DTO with scope
        $dto = ListCallLogsDTO::fromRequest($request);

        // Create new DTO with allowedAgentIds injected
        $scopedDto = new ListCallLogsDTO(
            page: $dto->page,
            perPage: $dto->perPage,
            deviceId: $dto->deviceId,
            agentIds: $dto->agentIds,
            callTypes: $dto->callTypes,
            classifications: $dto->classifications,
            outcomes: $dto->outcomes,
            dateFrom: $dto->dateFrom,
            dateTo: $dto->dateTo,
            search: $dto->search,
            user: $dto->user,
            teamId: $dto->teamId,
            allowedAgentIds: $allowedAgentIds,
            simSlot: $dto->simSlot,
        );

        $paginator = $this->service->list($scopedDto);

        return CallLogResource::collection($paginator);
    }
}
