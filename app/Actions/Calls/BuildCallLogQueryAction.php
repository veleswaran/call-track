<?php

declare(strict_types=1);

namespace App\Actions\Calls;

use App\Domain\Calls\DTOs\ListCallLogsDTO;
use App\Domain\Calls\Models\CallLog;
use Illuminate\Database\Eloquent\Builder;

/**
 * Builds the base query for listing call logs with allowed filters and eager loads.
 */
final class BuildCallLogQueryAction
{
    public function execute(ListCallLogsDTO $dto): Builder
    {
        $query = CallLog::query()
            ->with(['classification', 'device.agent'])
            ->orderByDesc('timestamp');

        if ($dto->deviceId !== null) {
            $query->where('device_id', $dto->deviceId);
        }

        if ($dto->callType !== null) {
            // Normalize to lower for comparison; DB may store mixed case
            $query->whereRaw('LOWER(direction) = ?', [strtolower($dto->callType)]);
        }

        if ($dto->classification !== null) {
            $query->whereHas('classification', function (Builder $q) use ($dto): void {
                $q->whereRaw('LOWER(type) = ?', [strtolower($dto->classification)]);
            });
        }

        if ($dto->dateFrom !== null) {
            $query->where('timestamp', '>=', $dto->dateFrom);
        }

        if ($dto->dateTo !== null) {
            $query->where('timestamp', '<=', $dto->dateTo);
        }

        if ($dto->search !== null) {
            $searchTerm = $dto->search;
            $query->where(function (Builder $q) use ($searchTerm) {
                // 1. Search by Contact Name (Case-insensitive)
                $termLower = strtolower($searchTerm);
                $q->whereIn('phone_number_hash', function ($subQuery) use ($termLower) {
                    $subQuery->select('phone_hash')
                        ->from('contacts')
                        ->whereRaw('LOWER(name) LIKE ?', ["%{$termLower}%"]);
                });

                // 2. Search by Phone Number (normalized)
                // Normalize search input to match stored normalized hash
                $normalizedSearch = \App\Support\PhoneNormalizer::normalize($searchTerm);
                $q->orWhere('phone_number_hash', hash('sha256', $normalizedSearch));
            });
        }

        if ($dto->agentId !== null) {
            $query->whereHas('device', function (Builder $q) use ($dto): void {
                $q->where('agent_id', $dto->agentId);
            });
        }

        return $query;
    }
}
