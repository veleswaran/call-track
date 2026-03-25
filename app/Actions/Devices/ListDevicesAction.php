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
            ->with(['agent', 'deviceStatus'])
            ->withExists('activeTokens');

        if ($dto->allowedAgentIds !== null && $dto->allowedAgentIds !== 'all') {
            $deviceQuery->whereIn('agent_id', (array) $dto->allowedAgentIds);
        }

        if ($dto->statusId !== null) {
            $deviceQuery->where('device_status_id', $dto->statusId);
        }

        return $deviceQuery
            ->when($dto->search, function (Builder $query, string $search) {
                $term = strtolower($search);
                $query->where(function ($q) use ($term) {
                    $q->whereRaw('LOWER(name) LIKE ?', ["%{$term}%"])
                        ->orWhereRaw('LOWER(model) LIKE ?', ["%{$term}%"])
                        ->orWhereRaw('LOWER(device_uuid::text) LIKE ?', ["%{$term}%"])
                        ->orWhereHas('agent', function ($q) use ($term) {
                            $q->whereRaw('LOWER(name) LIKE ?', ["%{$term}%"]);
                        });
                });
            })
            ->latest()
            ->paginate($dto->perPage, ['*'], 'page', $dto->page);
    }
}
