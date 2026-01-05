<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\DeviceResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class DeviceController extends Controller
{
    /**
     * List all devices
     */
    public function index(
        Request $request,
        \App\Actions\Devices\ListDevicesAction $listAction
    ): AnonymousResourceCollection {
        $dto = \App\Domain\Devices\DTOs\ListDevicesDTO::fromRequest($request);
        $devices = $listAction->execute($dto);

        return DeviceResource::collection($devices);
    }
}
