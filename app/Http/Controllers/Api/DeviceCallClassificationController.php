<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Contracts\Services\CallGovernanceServiceInterface;
use App\Domain\Calls\Models\CallLog;
use App\Domain\Classification\DTOs\CallClassificationDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\DeviceCallClassificationRequest;
use Illuminate\Http\JsonResponse;

class DeviceCallClassificationController extends Controller
{
    public function __construct(
        protected CallGovernanceServiceInterface $governanceService
    ) {}

    public function classify(DeviceCallClassificationRequest $request, string $callHash): JsonResponse
    {
        $device = $request->attributes->get('device');

        if (! $device) {
            return response()->json(['message' => 'Device authentication required'], 401);
        }

        $callLog = CallLog::where('device_id', $device->id)
            ->where('call_hash', $callHash)
            ->firstOrFail();

        $dto = new CallClassificationDTO(
            callLogId: $callLog->id,
            adminUserId: null,
            type: $request->validated('type'),
            reason: null,
            agentId: $device->agent_id,
            note: $request->validated('note'),
        );

        $this->governanceService->classifyCall($dto);

        return response()->json(['message' => 'Call classified successfully']);
    }
}
