<?php

declare(strict_types=1);

namespace App\Actions\Devices;

use App\Domain\Devices\DTOs\ListDevicesDTO;
use App\Domain\Devices\Models\Device;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class ListDevicesAction
{
    public function execute(ListDevicesDTO $dto): LengthAwarePaginator
    {
        $deviceQuery = Device::query()
            ->with('agent')
            ->withExists('activeTokens');

        if ($dto->allowedAgentIds !== null && $dto->allowedAgentIds !== 'all') {
            $deviceQuery->whereIn('agent_id', (array) $dto->allowedAgentIds);
        }

        return $deviceQuery
            ->when($dto->search, function (Builder $query, string $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('model', 'like', "%{$search}%")
                        ->orWhere('device_uuid', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate($dto->perPage, ['*'], 'page', $dto->page);
    }
}
