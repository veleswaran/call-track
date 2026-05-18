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
            ->where('status', '!=', 'archived')
            ->with(['agent'])
            ->withExists('activeTokens');

        if ($dto->allowedAgentIds !== null && $dto->allowedAgentIds !== 'all') {
            $deviceQuery->whereIn('agent_id', (array) $dto->allowedAgentIds);
        }

        if ($dto->status !== null) {
            if ($dto->status === 'active') {
                $deviceQuery->whereHas('activeTokens');
            } elseif ($dto->status === 'inactive') {
                $deviceQuery->whereDoesntHave('activeTokens');
            }
        }

        if ($dto->syncStatus !== null) {
            if ($dto->syncStatus === 'active') {
                $deviceQuery->where('last_heartbeat_at', '>=', now()->subMinutes(60));
            } elseif ($dto->syncStatus === 'warning') {
                $deviceQuery->where('last_heartbeat_at', '>=', now()->subMinutes(180))
                    ->where('last_heartbeat_at', '<', now()->subMinutes(60));
            } elseif ($dto->syncStatus === 'stale') {
                $deviceQuery->where(function ($q) {
                    $q->whereNull('last_heartbeat_at')
                        ->orWhere('last_heartbeat_at', '<', now()->subMinutes(180));
                });
            }
        }

        return $deviceQuery
            ->when($dto->search, function (Builder $query, string $search) {
                $term = strtolower(trim($search));
                $isPostgres = config('database.default') === 'pgsql';
                $query->where(function ($q) use ($term, $isPostgres) {
                    if (ctype_digit($term)) {
                        $q->orWhere('id', $term);
                    }

                    $q->orWhereRaw('LOWER(name) LIKE ?', ["%{$term}%"])
                        ->orWhereRaw('LOWER(model) LIKE ?', ["%{$term}%"])
                        ->orWhereRaw('LOWER(app_version) LIKE ?', ["%{$term}%"]);

                    if ($isPostgres) {
                        $q->orWhereRaw('LOWER(device_uuid::text) LIKE ?', ["%{$term}%"]);
                    } else {
                        $q->orWhere('device_uuid', 'LIKE', "%{$term}%");
                    }

                    $q->orWhereHas('agent', function ($q) use ($term) {
                        $q->whereRaw('LOWER(name) LIKE ?', ["%{$term}%"]);
                    });
                });

                $idColumn = $isPostgres ? 'id::text' : 'id';

                $query->orderByRaw("CASE 
                    WHEN {$idColumn} = ? THEN 1 
                    WHEN LOWER(name) = ? THEN 2 
                    WHEN LOWER(name) LIKE ? THEN 3 
                    ELSE 4 END", [$term, $term, "{$term}%"]);
            })
            ->latest()
            ->paginate($dto->perPage, ['*'], 'page', $dto->page);
    }
}
