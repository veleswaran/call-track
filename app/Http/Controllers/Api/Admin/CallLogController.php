<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Contracts\Services\CallLogExportServiceContract;
use App\Contracts\Services\CallLogQueryServiceContract;
use App\Domain\Auth\Actions\GetAgentAccessScopeAction;
use App\Domain\Calls\DTOs\ListCallLogsDTO;
use App\Domain\Users\Models\User;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ExportCallLogsRequest;
use App\Http\Requests\Admin\IndexCallLogsRequest;
use App\Http\Resources\CallLogResource;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CallLogController extends Controller
{
    public function __construct(
        private readonly CallLogQueryServiceContract $service,
        private readonly CallLogExportServiceContract $exportService,
        private readonly GetAgentAccessScopeAction $getAgentAccessScopeAction,
    ) {}

    /**
     * List all call logs
     */
    public function index(IndexCallLogsRequest $request): AnonymousResourceCollection
    {
        $scopedDto = $this->buildScopedDto($request);

        $paginator = $this->service->list($scopedDto);

        return CallLogResource::collection($paginator);
    }

    /**
     * Export filtered call logs as a streamed CSV download.
     */
    public function export(ExportCallLogsRequest $request): StreamedResponse
    {
        /** @var User $user */
        $user = $request->user();

        $allowedAgentIds = $this->getAgentAccessScopeAction->execute($user);
        $scopedDto = ListCallLogsDTO::fromExportRequest($request, $allowedAgentIds);

        return $this->exportService->export($scopedDto);
    }

    private function buildScopedDto(FormRequest $request): ListCallLogsDTO
    {
        /** @var User $user */
        $user = $request->user();

        $allowedAgentIds = $this->getAgentAccessScopeAction->execute($user);
        $dto = ListCallLogsDTO::fromRequest($request);

        return new ListCallLogsDTO(
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
            teamIds: $dto->teamIds,
            allowedAgentIds: $allowedAgentIds,
            simSlot: $dto->simSlot,
            contactFilter: $dto->contactFilter,
        );
    }
}
