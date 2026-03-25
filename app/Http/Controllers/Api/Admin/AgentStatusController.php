<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Domain\Agents\Models\AgentStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\AgentStatusResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class AgentStatusController extends Controller
{
    /**
     * Display a listing of the agent statuses.
     */
    public function index(): AnonymousResourceCollection
    {
        $statuses = AgentStatus::orderBy('name')->get();

        return AgentStatusResource::collection($statuses);
    }

    /**
     * Store a newly created agent status in storage.
     */
    public function store(Request $request): AgentStatusResource
    {
        // TODO: Replace with an Action class per architecture rules
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:agent_statuses,name'],
            'color' => ['nullable', 'string', 'max:20'],
            'is_default' => ['boolean'],
            'is_active' => ['boolean'],
        ]);

        if ($validated['is_default'] ?? false) {
            AgentStatus::query()->update(['is_default' => false]);
        }

        $status = AgentStatus::create([
            'name' => $validated['name'],
            'color' => $validated['color'] ?? '#6b7280',
            'is_default' => $validated['is_default'] ?? false,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return new AgentStatusResource($status);
    }

    /**
     * Update the specified agent status in storage.
     */
    public function update(Request $request, AgentStatus $agentStatus): AgentStatusResource
    {
        // TODO: Replace with an Action class
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255', 'unique:agent_statuses,name,' . $agentStatus->id],
            'color' => ['sometimes', 'string', 'max:20'],
            'is_default' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if (isset($validated['is_default']) && $validated['is_default'] === true && !$agentStatus->is_default) {
            AgentStatus::query()->update(['is_default' => false]);
        }

        if (isset($validated['is_default']) && $validated['is_default'] === false && $agentStatus->is_default) {
            if (AgentStatus::query()->where('id', '!=', $agentStatus->id)->doesntExist()) {
                unset($validated['is_default']);
            } else {
                AgentStatus::query()->where('id', '!=', $agentStatus->id)->first()->update(['is_default' => true]);
            }
        }

        $agentStatus->update($validated);

        return new AgentStatusResource($agentStatus);
    }

    /**
     * Remove the specified agent status from storage.
     */
    public function destroy(AgentStatus $agentStatus): Response
    {
        // TODO: Replace with an Action class that checks for assigned agents
        if ($agentStatus->is_default) {
            abort(400, 'Cannot delete the default status.');
        }

        if ($agentStatus->agents()->exists()) {
            abort(400, 'Cannot delete status while it is assigned to agents. Please reassign them first.');
        }

        $agentStatus->delete();

        return response()->noContent();
    }
}
