<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Teams;

use App\Contracts\Services\TeamServiceInterface;
use App\Domain\Teams\DTOs\RemoveTeamMemberDTO;
use App\Domain\Teams\Models\Team;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AddTeamMemberRequest;
use App\Http\Requests\Admin\StoreTeamRequest;
use App\Http\Requests\Admin\UpdateMemberRoleRequest;
use App\Http\Resources\TeamResource;
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
            'data' => TeamResource::collection($teams),
        ]);
    }

    public function show(string $team): JsonResponse
    {
        $teamModel = $this->teamService->getTeamWithDetails((int) $team);

        $this->authorize('view', $teamModel);

        return response()->json([
            'data' => new TeamResource($teamModel),
        ]);
    }

    public function store(StoreTeamRequest $request): JsonResponse
    {
        $this->authorize('create', Team::class);

        $team = $this->teamService->createTeam($request->validated()['name']);

        return response()->json([
            'data' => new TeamResource($team),
            'message' => 'Team created successfully.',
        ], Response::HTTP_CREATED);
    }

    public function addMember(AddTeamMemberRequest $request, string $team): JsonResponse
    {
        $teamModel = $this->teamService->findTeam((int) $team);
        $this->authorize('update', $teamModel);

        $dto = $request->toDTO((int) $team);

        $this->teamService->addMember($dto);

        return response()->json([
            'message' => 'Agent added to team successfully.',
        ]);
    }

    public function removeMember(string $team, string $agent): JsonResponse
    {
        $teamModel = $this->teamService->findTeam((int) $team);
        $this->authorize('update', $teamModel);

        $this->teamService->removeMember(
            new RemoveTeamMemberDTO((int) $team, (int) $agent)
        );

        return response()->json([
            'message' => 'Member removed from team successfully.',
        ]);
    }

    public function updateMemberRole(UpdateMemberRoleRequest $request, string $team, string $agent): JsonResponse
    {
        $teamModel = $this->teamService->findTeam((int) $team);
        $this->authorize('update', $teamModel);

        $this->teamService->updateMemberRole(
            $request->toDTO((int) $team, (int) $agent)
        );

        return response()->json([
            'message' => 'Member role updated successfully.',
        ]);
    }
}
