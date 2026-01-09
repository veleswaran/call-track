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
            ->with(['classification', 'device.agent'])
            ->orderByDesc('timestamp');

        // Access Control Scope
        if ($dto->user && ! $dto->user->hasRole(['super-admin', 'admin'])) {
            /** @var \App\Domain\Agents\Models\Agent|null $userAgent */
            $userAgent = $dto->user->agent;

            if (! $userAgent) {
                // If user has no agent (and not admin), they shouldn't see anything or handle error.
                // For safety, return empty.
                $query->whereRaw('1 = 0');
            } else {
                $query->whereHas('device', function ($deviceQuery) use ($userAgent) {
                    $deviceQuery->where(function ($q) use ($userAgent) {
                        // 1. Own records
                        $q->where('agent_id', $userAgent->id);

                        // 2. Team records where I am a manager
                        $q->orWhereIn('agent_id', function ($sub) use ($userAgent) {
                            $sub->select('team_members.agent_id')
                                ->from('team_members')
                                ->join('team_members as my_membership', 'team_members.team_id', '=', 'my_membership.team_id')
                                ->where('my_membership.agent_id', $userAgent->id)
                                ->where('my_membership.role', 'MANAGER');
                        });
                    });
                });
            }
        }

        if ($dto->deviceId !== null) {
            $query->where('device_id', $dto->deviceId);
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

        // Filter by Statuses (Connected, Missed, No Answer)
        if (! empty($dto->statuses)) {
            $query->where(function (Builder $q) use ($dto) {
                foreach ($dto->statuses as $status) {
                    $q->orWhere(function (Builder $sub) use ($status) {
                        switch ($status) {
                            case 'Connected':
                                $sub->where('duration', '>', 0);
                                break;
                            case 'Missed':
                                $sub->where('direction', 'MISSED');
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

        // Filter by Agents
        if (! empty($dto->agentIds)) {
            $query->whereHas('device', function (Builder $q) use ($dto): void {
                $q->whereIn('agent_id', $dto->agentIds);
            });
        }

        return $query;
    }
}
