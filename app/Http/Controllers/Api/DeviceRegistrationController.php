<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Domain\Devices\Models\Device;
use App\Http\Controllers\Controller;

class DeviceRegistrationController extends Controller
{
    public function __construct(
        protected \App\Contracts\Services\DeviceRegistrationServiceInterface $service
    ) {}

    /**
     * Register a new device using a registration code
     */
    public function store(\App\Http\Requests\RegisterDeviceWithCodeRequest $request): \Illuminate\Http\JsonResponse
    {
        $dto = \App\Domain\Devices\DTOs\RegisterDeviceData::fromArray([
            'device_uuid' => $request->validated('device_uuid'),
            'name' => $request->validated('device_name'),
            'model' => $request->validated('device_model'),
            'os_version' => $request->validated('os_version'),
            'app_version' => $request->validated('app_version'),
        ]);

        $result = $this->service->registerDevice(
            $request->validated('code'),
            $dto
        );

        return response()->json([
            'message' => 'Device registered successfully',
            'device_id' => $result['device_id'],
            'token' => $result['token'],
        ], 201);
    }
}
