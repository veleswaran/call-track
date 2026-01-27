<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Contracts\Services\DeviceEventServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Resources\DeviceEventResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeviceEventController extends Controller
{
    public function __construct(
        protected DeviceEventServiceInterface $deviceEventService
    ) {}

    public function index(Request $request, string $deviceId): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 15);

        $events = $this->deviceEventService->getDeviceEvents((int) $deviceId, $perPage);

        return response()->json([
            'data' => DeviceEventResource::collection($events),
            'meta' => [
                'current_page' => $events->currentPage(),
                'from' => $events->firstItem(),
                'last_page' => $events->lastPage(),
                'per_page' => $events->perPage(),
                'to' => $events->lastItem(),
                'total' => $events->total(),
            ],
        ]);
    }
}
