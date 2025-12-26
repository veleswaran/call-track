<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Domain\Devices\Models\Device;
use App\Domain\Devices\Models\DeviceRegistrationCode;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DeviceRegistrationController extends Controller
{
    /**
     * Register a new device using a registration code
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string',
            'device_name' => 'required|string',
            'device_model' => 'nullable|string',
            'os_version' => 'nullable|string',
            'app_version' => 'nullable|string',
        ]);

        // Find valid code
        $registrationCode = DeviceRegistrationCode::where('code', $validated['code'])
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->first();

        if (! $registrationCode) {
            return response()->json(['message' => 'Invalid or expired registration code'], 422);
        }

        // Create or update device?
        // Typically registration implies new device.
        // We'll create a new device entry.

        $device = Device::create([
            'name' => $validated['device_name'],
            'model' => $validated['device_model'] ?? null,
            'os_version' => $validated['os_version'] ?? null,
            'app_version' => $validated['app_version'] ?? null,
            'agent_id' => $registrationCode->agent_id,
        ]);

        // Mark code as used
        $registrationCode->update([
            'used_at' => now(),
            'used_by_device_id' => $device->id,
        ]);

        // Generate Token
        // Assuming Device model has tokens relationship and Sanctum/Custom token logic
        // We use custom token table `device_tokens`
        $tokenString = Str::random(60);
        $device->tokens()->create([
            'token' => hash('sha256', $tokenString),
            'device_name' => $validated['device_name'],
        ]);

        return response()->json([
            'message' => 'Device registered successfully',
            'device_id' => $device->id,
            'token' => $tokenString, // PlainText token returned only once
        ], 201);
    }
}
