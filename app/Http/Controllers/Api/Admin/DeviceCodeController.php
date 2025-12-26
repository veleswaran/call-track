<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Domain\Devices\Models\DeviceRegistrationCode;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DeviceCodeController extends Controller
{
    /**
     * Generate a new registration code for an agent
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'agent_id' => 'required|exists:agents,id',
            'expires_in_hours' => 'nullable|integer|min:1|max:48',
        ]);

        $code = strtoupper(Str::random(6)); // 6 character alphanumeric code

        while (DeviceRegistrationCode::where('code', $code)->exists()) {
            $code = strtoupper(Str::random(6));
        }

        $registrationCode = DeviceRegistrationCode::create([
            'code' => $code,
            'agent_id' => $validated['agent_id'],
            'expires_at' => now()->addHours($validated['expires_in_hours'] ?? 24),
        ]);

        return response()->json([
            'data' => [
                'code' => $registrationCode->code,
                'expires_at' => $registrationCode->expires_at,
                'agent_id' => $registrationCode->agent_id,
            ],
        ], 201);
    }

    /**
     * List active codes
     */
    public function index()
    {
        $codes = DeviceRegistrationCode::with('agent')
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->latest()
            ->paginate(20);

        return response()->json($codes);
    }
}
