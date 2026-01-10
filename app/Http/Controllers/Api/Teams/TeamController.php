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

    public function show(Team $team): JsonResponse
    {
        $this->authorize('view', $team);

        $teamWithDetails = $this->teamService->getTeamWithDetails($team->id);

        return response()->json([
            'data' => new \App\Http\Resources\TeamResource($teamWithDetails),
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

    public function addMember(\App\Http\Requests\Admin\AddTeamMemberRequest $request, Team $team): JsonResponse
    {
        $this->authorize('update', $team);

        $dto = $request->toDTO($team->id);

        $this->teamService->addMember($dto);

        return response()->json([
            'message' => 'Agent added to team successfully.',
        ]);
    }

    public function removeMember(Team $team, Agent $agent): JsonResponse
    {
        $this->authorize('update', $team);

        $this->teamService->removeMember($team, $agent);

        return response()->json([
            'message' => 'Member removed from team successfully.',
        ]);
    }

    public function updateMemberRole(Request $request, Team $team, Agent $agent): JsonResponse
    {
        $this->authorize('update', $team);

        $validated = $request->validate([
            'role' => 'required|in:MEMBER,MANAGER',
        ]);

        $this->teamService->updateMemberRole($team, $agent, $validated['role']);

        return response()->json([
            'message' => 'Member role updated successfully.',
        ]);
    }
}
