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

        $team->load(['members']);

        // Transform members to include role from pivot
        $members = $team->members->map(function (Agent $agent) {
            return [
                'id' => $agent->pivot->id ?? $agent->id,
                'team_id' => $agent->pivot->team_id ?? null,
                'agent_id' => $agent->id,
                'role' => $agent->pivot->role ?? 'MEMBER',
                'created_at' => $agent->pivot->created_at ?? $agent->created_at,
                'updated_at' => $agent->pivot->updated_at ?? $agent->updated_at,
                'agent' => [
                    'id' => $agent->id,
                    'name' => $agent->name,
                ],
            ];
        });

        return response()->json([
            'data' => [
                'id' => $team->id,
                'name' => $team->name,
                'created_at' => $team->created_at,
                'updated_at' => $team->updated_at,
                'members' => $members,
                'members_count' => $team->members()->count(),
                'managers_count' => $team->members()->wherePivot('role', 'MANAGER')->count(),
            ],
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
