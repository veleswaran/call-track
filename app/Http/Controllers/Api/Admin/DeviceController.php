<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Domain\Devices\Models\Device;
use App\Http\Controllers\Controller;
use App\Http\Resources\DeviceResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class DeviceController extends Controller
{
    /**
     * List all devices
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Device::query()->withExists('activeTokens')->latest();

        $devices = $query->paginate($request->input('per_page', 15));

        return DeviceResource::collection($devices);
    }
}
