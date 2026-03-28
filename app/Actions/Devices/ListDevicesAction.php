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
                $term = strtolower($search);
                $query->where(function ($q) use ($term) {
                    $q->whereRaw('LOWER(name) LIKE ?', ["%{$term}%"])
                        ->orWhereRaw('LOWER(model) LIKE ?', ["%{$term}%"])
                        ->orWhereRaw('LOWER(device_uuid) LIKE ?', ["%{$term}%"]);
                });
            })
            ->latest()
            ->paginate($dto->perPage, ['*'], 'page', $dto->page);
    }
}
