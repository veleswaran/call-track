<?php
declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Actions\Devices\CreateDeviceStatusAction;
use App\Actions\Devices\DeleteDeviceStatusAction;
use App\Actions\Devices\UpdateDeviceStatusAction;
use App\Domain\Devices\DTOs\DeviceStatusData;
use App\Domain\Devices\Models\DeviceStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\DeviceStatusResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class DeviceStatusController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return DeviceStatusResource::collection(DeviceStatus::orderBy('name')->get());
    }

    public function store(Request $request, CreateDeviceStatusAction $action): DeviceStatusResource
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:device_statuses,name',
            'color' => 'nullable|string|max:20',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $dto = DeviceStatusData::fromArray($validated);
        $status = $action->execute($dto);

        return new DeviceStatusResource($status);
    }

    public function update(Request $request, DeviceStatus $deviceStatus, UpdateDeviceStatusAction $action): DeviceStatusResource
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:device_statuses,name,' . $deviceStatus->id,
            'color' => 'nullable|string|max:20',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $dto = DeviceStatusData::fromArray($validated);
        $status = $action->execute($deviceStatus, $dto);

        return new DeviceStatusResource($status);
    }

    public function destroy(DeviceStatus $deviceStatus, DeleteDeviceStatusAction $action)
    {
        try {
            $action->execute($deviceStatus);
            return response()->noContent();
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
