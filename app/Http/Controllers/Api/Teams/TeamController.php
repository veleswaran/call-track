<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Teams;

use App\Contracts\Services\Teams\TeamManagementServiceInterface;
use App\Contracts\Services\Teams\TeamMemberServiceInterface;
use App\Contracts\Services\Teams\TeamQueryServiceInterface;
use App\Domain\Teams\Models\Team;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AddTeamMemberRequest;
use App\Http\Requests\Admin\StoreTeamRequest;
use App\Http\Requests\Admin\UpdateMemberRoleRequest;
use App\Http\Requests\Admin\UpdateTeamRequest;
use App\Http\Resources\TeamResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

final class TeamController extends Controller
{
    public function __construct(
        private readonly TeamManagementServiceInterface $teamManagementService,
        private readonly TeamMemberServiceInterface $teamMemberService,
        private readonly TeamQueryServiceInterface $teamQueryService,
    ) {
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Team::class);

        $perPage = (int) $request->input('per_page', 20);
        $teams = $this->teamQueryService->getPaginatedTeams($request->user(), $perPage);

        return TeamResource::collection($teams);
    }

    public function show(string $team): JsonResponse
    {
        $teamModel = $this->teamQueryService->getTeamWithDetails((int) $team);

        $this->authorize('view', $teamModel);

        return response()->json([
            'data' => new TeamResource($teamModel),
        ]);
    }

    public function store(StoreTeamRequest $request): JsonResponse
    {
        $this->authorize('create', Team::class);

        $team = $this->teamManagementService->createTeam($request->validated()['name']);

        return response()->json([
            'data' => new TeamResource($team),
            'message' => 'Team created successfully.',
        ], Response::HTTP_CREATED);
    }

    public function update(UpdateTeamRequest $request, string $team): JsonResponse
    {
        $teamModel = $this->teamManagementService->findTeam((int) $team);
        $this->authorize('update', $teamModel);

        $updated = $this->teamManagementService->updateTeam($teamModel, $request->validated()['name']);

        return response()->json([
            'data' => new TeamResource($updated),
            'message' => 'Team updated successfully.',
        ]);
    }

    public function addMember(AddTeamMemberRequest $request, string $team): JsonResponse
    {
        $teamModel = $this->teamManagementService->findTeam((int) $team);
        $this->authorize('update', $teamModel);

        $dto = $request->toDTO($teamModel->id);

        $this->teamMemberService->addMember($teamModel, $dto);

        return response()->json([
            'message' => 'Agent added to team successfully.',
        ]);
    }

    public function removeMember(string $team, string $agent): JsonResponse
    {
        $teamModel = $this->teamManagementService->findTeam((int) $team);
        $this->authorize('update', $teamModel);

        $this->teamMemberService->removeMember($teamModel, (int) $agent);

        return response()->json([
            'message' => 'Member removed from team successfully.',
        ]);
    }

    public function updateMemberRole(UpdateMemberRoleRequest $request, string $team, string $agent): JsonResponse
    {
        $teamModel = $this->teamManagementService->findTeam((int) $team);
        $this->authorize('update', $teamModel);

        $this->teamMemberService->updateMemberRole(
            $teamModel,
            $request->toDTO($teamModel->id, (int) $agent)
        );

        return response()->json([
            'message' => 'Member role updated successfully.',
        ]);
    }

    public function destroy(string $team): JsonResponse
    {
        $teamModel = $this->teamManagementService->findTeam((int) $team);
        $this->authorize('delete', $teamModel);

        $this->teamManagementService->deleteTeam($teamModel);

        return response()->json([
            'message' => 'Team deleted successfully.',
        ]);
    }
}
