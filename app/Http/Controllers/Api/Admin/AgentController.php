<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Contracts\Services\AgentManagementServiceInterface;
use App\Domain\Agents\DTOs\AgentData;
use App\Domain\Agents\Models\Agent;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAgentRequest;
use App\Http\Requests\UpdateAgentRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AgentController extends Controller
{
    public function __construct(
        protected AgentManagementServiceInterface $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        $search = $request->input('search');
        $perPage = (int) $request->input('per_page', 20);

        return response()->json($this->service->getAgentsList($perPage, $search));
    }

    public function store(StoreAgentRequest $request): JsonResponse
    {
        $dto = AgentData::fromArray($request->validated());
        $agent = $this->service->createAgent($dto);

        return response()->json($agent, 201);
    }

    public function update(UpdateAgentRequest $request, Agent $agent): JsonResponse
    {
        $dto = AgentData::fromArray($request->validated());
        $updatedAgent = $this->service->updateAgent($agent, $dto);

        return response()->json($updatedAgent);
    }
}
