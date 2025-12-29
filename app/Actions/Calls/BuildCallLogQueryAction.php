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
            ->with('classification')
            ->latest();

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

        // agentId filter intentionally omitted until device-agent relationship is defined

        return $query;
    }
}
