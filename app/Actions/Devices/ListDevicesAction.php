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
            ->with(['agent'])
            ->withExists('activeTokens');

        if ($dto->allowedAgentIds !== null && $dto->allowedAgentIds !== 'all') {
            $deviceQuery->whereIn('agent_id', (array) $dto->allowedAgentIds);
        }

        if ($dto->status !== null) {
            $deviceQuery->where('status', $dto->status);
        }

        return $deviceQuery
            ->when($dto->search, function (Builder $query, string $search) {
                $term = strtolower($search);
                $isPostgres = config('database.default') === 'pgsql';
                $query->where(function ($q) use ($term, $isPostgres) {
                    $q->whereRaw('LOWER(name) LIKE ?', ["%{$term}%"])
                        ->orWhereRaw('LOWER(model) LIKE ?', ["%{$term}%"]);

                    if ($isPostgres) {
                        $q->orWhereRaw('LOWER(device_uuid::text) LIKE ?', ["%{$term}%"]);
                    } else {
                        $q->orWhere('device_uuid', 'LIKE', "%{$term}%");
                    }

                    $q->orWhereHas('agent', function ($q) use ($term) {
                        $q->whereRaw('LOWER(name) LIKE ?', ["%{$term}%"]);
                    });
                });
            })
            ->latest()
            ->paginate($dto->perPage, ['*'], 'page', $dto->page);
    }
}
