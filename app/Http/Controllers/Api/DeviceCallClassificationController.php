<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Contracts\Services\CallGovernanceServiceInterface;
use App\Domain\Calls\Models\CallLog;
use App\Domain\Classification\DTOs\CallClassificationDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\BatchDeviceClassificationRequest;
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
            reason: null, // Devices don't provide 'reason' separately from 'note' usually? Or maybe reason is standard?
            // User requested "add call notes". I'll map note to 'note'.
            // And use 'type' as classification.
            agentId: $device->agent_id,
            note: $request->validated('note'),
        );

        $this->governanceService->classifyCall($dto);

        return response()->json(['message' => 'Call classified successfully']);
    }

    public function classifyBatch(BatchDeviceClassificationRequest $request): JsonResponse
    {
        $device = $request->attributes->get('device');

        if (! $device) {
            return response()->json(['message' => 'Device authentication required'], 401);
        }

        $items = $request->validated('classifications');
        $hashes = array_column($items, 'call_hash');

        // Fetch all relevant call logs in one query
        $callLogs = CallLog::where('device_id', $device->id)
            ->whereIn('call_hash', $hashes)
            ->get()
            ->keyBy('call_hash');

        $dtos = [];
        foreach ($items as $item) {
            $callLog = $callLogs->get($item['call_hash']);

            // If checking explicitly for missing logs is needed, we could throw exception or skip.
            // Skipping is safer for batch, or fail if rigor required. Sync usually ignores missing.
            // But classify assumes call exists. I'll skip if not found to avoid crash.
            if (! $callLog) {
                continue;
            }

            $dtos[] = new CallClassificationDTO(
                callLogId: $callLog->id,
                adminUserId: null,
                type: $item['type'],
                reason: null,
                agentId: $device->agent_id,
                note: $item['note'] ?? null,
            );
        }

        if (! empty($dtos)) {
            $this->governanceService->classifyCalls($dtos);
        }

        return response()->json(['message' => 'Calls classified successfully']);
    }
}
