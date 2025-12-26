<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Domain\Calls\Models\CallLog;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DeviceSyncController extends Controller
{
    /**
     * Sync call logs from device
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'logs' => 'required|array',
            'logs.*.call_hash' => 'required|string',
            'logs.*.phone_number' => 'required|string',
            'logs.*.direction' => 'required|string',
            'logs.*.duration' => 'required|integer',
            'logs.*.timestamp' => 'required|date', // or integer timestamp? standard indicates ISO8601 or unix. Let's assume ISO string.
            'logs.*.sim_slot' => 'nullable|integer',
        ]);

        $device = $request->attributes->get('device'); // From DeviceAuthMiddleware

        $count = 0;
        foreach ($validated['logs'] as $logData) {
            // Check existence by hash + device
            $exists = CallLog::where('device_id', $device->id)
                ->where('call_hash', $logData['call_hash'])
                ->exists();

            if ($exists) {
                continue;
            }

            CallLog::create([
                'device_id' => $device->id,
                'call_hash' => $logData['call_hash'],
                'phone_number' => $logData['phone_number'], // Will be encrypted by model cast
                'phone_number_hash' => hash('sha256', $logData['phone_number']), // Hash for search
                'direction' => $logData['direction'],
                'duration' => $logData['duration'],
                'timestamp' => Carbon::parse($logData['timestamp']),
                'sim_slot' => $logData['sim_slot'] ?? 0,
            ]);
            $count++;
        }

        // Update last sync
        $device->update(['last_sync_at' => now()]);

        return response()->json([
            'message' => 'Sync completed',
            'synced_count' => $count,
        ]);
    }
}
