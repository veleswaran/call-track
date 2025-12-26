<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Contracts\Services\AgentManagementServiceInterface;
use App\Domain\Agents\Models\Agent;
use App\Domain\Devices\Models\Device;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeviceAgentController extends Controller
{
    public function __construct(
        protected AgentManagementServiceInterface $service
    ) {}

    public function assign(Request $request, Device $device): JsonResponse
    {
        $request->validate(['agent_id' => 'required|exists:agents,id']);
        
        $agent = Agent::findOrFail($request->agent_id);
    
        $updatedDevice = $this->service->assignDevice($device, $agent);

        return response()->json([
            'message' => 'Device assigned to agent successfully',
            'device_id' => $updatedDevice->id,
            'agent_id' => $updatedDevice->agent_id,
        ]);
    }

    public function unassign(Device $device): JsonResponse
    {
        $updatedDevice = $this->service->unassignDevice($device);

        return response()->json([
            'message' => 'Device unassigned from agent successfully',
            'device_id' => $updatedDevice->id,
        ]);
    }
}
