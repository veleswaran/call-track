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
        \App\Actions\Devices\ListDevicesAction $listAction,
        \App\Domain\Auth\Actions\GetAgentAccessScopeAction $getAgentAccessScopeAction
    ): AnonymousResourceCollection {
        /** @var \App\Domain\Users\Models\User $user */
        $user = $request->user();

        // Resolve scope: 'all' or array of agent IDs
        $scope = $getAgentAccessScopeAction->execute($user);

        // Pass scope to DTO factory
        $dto = \App\Domain\Devices\DTOs\ListDevicesDTO::fromRequest($request, $scope);
        $devices = $listAction->execute($dto);

        return DeviceResource::collection($devices);
    }
}
