<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Contracts\Services\CallGovernanceServiceInterface;
use App\Domain\Classification\DTOs\CallClassificationDTO;
use Illuminate\Http\JsonResponse;

class CallClassificationController extends Controller
{
    public function __construct(
        protected CallGovernanceServiceInterface $governanceService
    ) {}

    /**
     * Classify a call log.
     */
    public function store(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'string', 'in:BUSINESS,PERSONAL,IGNORED'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $dto = new CallClassificationDTO(
            callLogId: (int) $id,
            adminUserId: (int) $request->user()->id,
            type: $validated['type'],
            reason: $validated['reason'] ?? null,
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
