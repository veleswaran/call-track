<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Http\Requests\StoreCallLogsRequest;
use App\Contracts\Services\CallSyncServiceInterface;
use App\Domain\Calls\DTOs\SyncCallLogsDTO;
use App\Domain\Calls\DTOs\CallLogData;
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
            );
        }

        $dto = new SyncCallLogsDTO(
            device: $device,
            logs: $logsData
        );

        $this->syncService->sync($dto);

        return response()->json(['message' => 'Logs synced successfully']);
    }
}
