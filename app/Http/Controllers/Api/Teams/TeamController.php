<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Teams;

use App\Contracts\Services\TeamServiceInterface;
use App\Domain\Agents\Models\Agent;
use App\Domain\Teams\Models\Team;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class TeamController extends Controller
{
    public function __construct(
        protected TeamServiceInterface $teamService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Team::class);

        $teams = $this->teamService->getAllTeams();

        return response()->json([
            'data' => $teams,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Team::class);

        $validated = $request->validate([
            'name' => 'required|string|unique:teams,name|max:255',
        ]);

        $team = $this->teamService->createTeam($validated['name']);

        return response()->json([
            'data' => $team,
            'message' => 'Team created successfully.',
        ], Response::HTTP_CREATED);
    }

    public function addMember(Request $request, Team $team): JsonResponse
    {
        $this->authorize('update', $team);

        $validated = $request->validate([
            'agent_id' => 'required|exists:agents,id',
            'role' => 'nullable|in:MEMBER,MANAGER',
        ]);

        $agent = Agent::findOrFail($validated['agent_id']);
        $role = $validated['role'] ?? 'MEMBER';

        if ($role === 'MANAGER') {
            $this->teamService->assignManager($team, $agent);
        } else {
            $this->teamService->addAgent($team, $agent);
        }

        return response()->json([
            'message' => 'Agent added to team successfully.',
        ]);
    }
}
