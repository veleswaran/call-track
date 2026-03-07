<?php

declare(strict_types=1);

namespace App\Actions\Calls;

use App\Domain\Calls\DTOs\ListCallLogsDTO;
use App\Domain\Calls\Models\CallLog;
use Carbon\Carbon;
/**
 * Builds the base query for listing call logs with allowed filters and eager loads.
 */
use Illuminate\Database\Eloquent\Builder;

final class BuildCallLogQueryAction
{
    public function execute(ListCallLogsDTO $dto): Builder
    {
        $query = CallLog::query()
            ->with(['classification', 'device', 'agent'])
            ->orderByDesc('timestamp');

        // Access Control Scope - uses pre-calculated allowedAgentIds from Controller
        if ($dto->allowedAgentIds !== null) {
            if (empty($dto->allowedAgentIds)) {
                $query->whereRaw('1 = 0');
            } else {
                $query->whereHas('device', function ($deviceQuery) use ($dto) {
                    $deviceQuery->whereIn('agent_id', $dto->allowedAgentIds);
                });
            }
        }

        if ($dto->deviceId !== null) {
            $query->where('device_id', $dto->deviceId);
        }

        if ($dto->simSlot !== null) {
            $query->where('sim_slot', $dto->simSlot);
        }

        // Filter by Call Types (Direction)
        if (! empty($dto->callTypes)) {
            $query->whereIn('direction', array_map('strtoupper', $dto->callTypes));
        }

        // Filter by Classifications
        if (! empty($dto->classifications)) {
            $query->whereHas('classification', function (Builder $q) use ($dto): void {
                $q->whereIn('type', array_map('strtoupper', $dto->classifications));
            });
        }

        // Filter by Call Outcomes (Connected, Missed, No Answer)
        if (! empty($dto->outcomes)) {
            $query->where(function (Builder $q) use ($dto) {
                foreach ($dto->outcomes as $outcome) {
                    $q->orWhere(function (Builder $sub) use ($outcome) {
                        switch ($outcome) {
                            case 'Connected':
                                $sub->where('duration', '>', 0);
                                break;
                            case 'Missed':
                                // MISSED, REJECTED, BLOCKED direction OR INCOMING with 0 duration
                                $sub->where(function (Builder $inner) {
                                    $inner->whereIn('direction', ['MISSED', 'REJECTED', 'BLOCKED'])
                                        ->orWhere(function (Builder $inc) {
                                            $inc->where('direction', 'INCOMING')->where('duration', 0);
                                        });
                                });
                                break;
                            case 'No Answer':
                                $sub->where('direction', 'OUTGOING')->where('duration', 0);
                                break;
                        }
                    });
                }
            });
        }

        // Date Filters
        if ($dto->dateFrom !== null) {
            $query->where('timestamp', '>=', Carbon::parse($dto->dateFrom));
        }

        if ($dto->dateTo !== null) {
            $query->where('timestamp', '<=', Carbon::parse($dto->dateTo)->endOfDay());
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
                $normalizedSearch = \App\Support\PhoneNormalizer::normalize($searchTerm);
                $q->orWhere('phone_number_hash', hash('sha256', $normalizedSearch));
            });
        }

        // Filter by Agents (uses call_logs.agent_id for accurate historical filtering)
        if (! empty($dto->agentIds)) {
            $query->whereIn('agent_id', $dto->agentIds);
        }

        // Filter by Team
        if ($dto->teamId !== null) {
            $query->whereHas('device.agent.teams', function (Builder $q) use ($dto): void {
                $q->where('teams.id', $dto->teamId);
            });
        }

        return $query;
    }
}
