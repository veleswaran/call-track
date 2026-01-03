<?php

namespace App\Http\Controllers\Api\Admin;

use App\Contracts\Services\CallGovernanceServiceInterface;
use App\Domain\Classification\DTOs\CallClassificationDTO;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CallClassificationController extends Controller
{
    public function __construct(
        protected CallGovernanceServiceInterface $governanceService
    ) {}

    /**
     * Classify a call log.
     */
    public function store(\App\Http\Requests\StoreClassificationRequest $request, string $id): JsonResponse
    {
        $dto = new CallClassificationDTO(
            callLogId: (int) $id,
            adminUserId: (int) $request->user()->id,
            type: $request->validated('type'),
            reason: $request->validated('reason'),
        );

        $this->governanceService->classifyCall($dto);

        return response()->json(['message' => 'Call classified successfully']);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
