<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Device;

use App\Contracts\Services\DeviceEventServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\Device\StoreDeviceEventRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class DeviceEventController extends Controller
{
    public function __construct(
        protected DeviceEventServiceInterface $deviceEventService
    ) {}

    public function store(StoreDeviceEventRequest $request): JsonResponse
    {
        $device = $request->attributes->get('device');

        $event = $this->deviceEventService->storeEvent(
            $request->toDTO($device->id)
        );

        return response()->json([
            'message' => 'Event recorded successfully.',
            'data' => [
                'id' => $event->id,
                'event_type' => $event->event_type,
                'occurred_at' => $event->occurred_at,
            ],
        ], Response::HTTP_CREATED);
    }
}
