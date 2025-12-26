<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Actions\Devices\RegisterDeviceAction;
use App\Domain\Devices\DTOs\RegisterDeviceData;
use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterDeviceRequest;
use Illuminate\Http\JsonResponse;

class DeviceRegistrationController extends Controller
{
    public function __construct(
        protected RegisterDeviceAction $registerDeviceAction
    ) {}

    public function store(RegisterDeviceRequest $request): JsonResponse
    {
        $dto = RegisterDeviceData::fromArray($request->validated());

        $result = $this->registerDeviceAction->execute($dto);

        return response()->json([
            'message' => 'Device registered successfully',
            'device_id' => $result['device']->id,
            'token' => $result['token'],
        ], 201);
    }
}
