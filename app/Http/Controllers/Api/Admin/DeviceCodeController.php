<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class DeviceCodeController extends Controller
{
    public function __construct(
        protected \App\Contracts\Services\DeviceCodeServiceInterface $deviceCodeService
    ) {}

    /**
     * Generate a new registration code for an agent
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'agent_id' => 'required|exists:agents,id',
            'expires_in_hours' => 'nullable|integer|min:1|max:48',
        ]);

        $dto = new \App\Domain\Devices\DTOs\GenerateDeviceCodeDTO(
            agentId: (int) $validated['agent_id'],
            expiresInHours: (int) ($validated['expires_in_hours'] ?? 24)
        );

        $registrationCode = $this->deviceCodeService->generateCode($dto);

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
        $codes = $this->deviceCodeService->listActiveCodes();

        return response()->json($codes);
    }
}
