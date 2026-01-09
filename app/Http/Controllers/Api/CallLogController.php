<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Services\CallSyncServiceInterface;
use App\Domain\Calls\DTOs\CallLogData;
use App\Domain\Calls\DTOs\SyncCallLogsDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCallLogsRequest;
use Illuminate\Http\JsonResponse;

class CallLogController extends Controller
{
    public function __construct(
        protected CallSyncServiceInterface $syncService
    ) {}

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreCallLogsRequest $request): JsonResponse
    {
        $device = $request->attributes->get('device');

        // Fail-safe if middleware logic changes
        if (! $device) {
            return response()->json(['message' => 'Device authentication required'], 401);
        }

        $logsData = [];
        foreach ($request->validated('logs') as $log) {
            $logsData[] = new CallLogData(
                callHash: $log['call_hash'],
                phoneNumber: $log['phone_number'],
                direction: $log['direction'],
                duration: (int) $log['duration'],
                timestamp: $log['timestamp'],
                simSlot: (int) ($log['sim_slot'] ?? 0),
                classificationType: $log['classification']['type'] ?? null,
                classificationNote: $log['classification']['note'] ?? null,
            );
        }

        $dto = new SyncCallLogsDTO(
            device: $device,
            logs: $logsData,
            batteryLevel: $request->has('battery_level') ? (int) $request->validated('battery_level') : null,
        );

        $this->syncService->sync($dto);

        return response()->json(['message' => 'Logs synced successfully']);
    }
}
