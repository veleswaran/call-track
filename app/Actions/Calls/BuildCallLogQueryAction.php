<?php

declare(strict_types=1);

namespace App\Actions\Calls;

use App\Actions\Contacts\GetContactHashVariationsAction;
use App\Domain\Calls\DTOs\ListCallLogsDTO;
use App\Domain\Calls\Models\CallLog;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
/**
 * Builds the base query for listing call logs with allowed filters and eager loads.
 */
use Illuminate\Database\Eloquent\Builder;

final class BuildCallLogQueryAction
{
    public function __construct(
        protected GetContactHashVariationsAction $getContactHashesAction
    ) {}

    public function execute(ListCallLogsDTO $dto): Builder
    {
        $query = CallLog::query()
            ->select('call_logs.*')
            ->addSelect(DB::raw(CallLog::getOutcomeCaseSql()." as call_outcome"))
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
                                $q->connected();
                                break;
                            case 'Missed':
                                $q->missed();
                                break;
                            case 'No Answer':
                                $q->noAnswer();
                                break;
                        }
                    });
                }
            });
        }

        // Date Filters
        if ($dto->dateFrom !== null) {
            $query->where('timestamp', '>=', Carbon::parse($dto->dateFrom)->startOfDay());
        }

        if ($dto->dateTo !== null) {
            $query->where('timestamp', '<=', Carbon::parse($dto->dateTo)->endOfDay());
        }
        // Search by Contact Name or Phone
        if ($dto->search) {
            $searchTerm = $dto->search;
            $query->where(function (Builder $q) use ($searchTerm) {
                // 1. Search by Contact Name (Case-insensitive)
                $termLower = strtolower($searchTerm);

                $matchingContacts = \App\Domain\Calls\Models\Contact::whereRaw('LOWER(name) LIKE ?', ["%{$termLower}%"])
                    ->get() // Use get() to ensure phone_number is decrypted via model casting
                    ->pluck('phone_number')
                    ->filter()
                    ->all();

                if (! empty($matchingContacts)) {
                    $searchHashes = [];
                    foreach ($matchingContacts as $num) {
                        $searchHashes = array_merge($searchHashes, \App\Support\PhoneNormalizer::generateHashVariations($num));
                    }
                    $q->whereIn('phone_number_hash', array_unique($searchHashes));
                }

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
        if (! empty($dto->teamIds)) {
            $query->whereHas('device.agent.teams', function (Builder $q) use ($dto): void {
                $q->whereIn('teams.id', $dto->teamIds);
            });
        }

        // Filter by Internal/External (Contacts)
        if ($dto->contactFilter !== null && $dto->contactFilter !== 'all') {
            $contactHashes = $this->getContactHashesAction->execute();

            if ($dto->contactFilter === 'internal') {
                $query->whereIn('phone_number_hash', $contactHashes);
            } else {
                $query->whereNotIn('phone_number_hash', $contactHashes);
            }
        }

        return $query;
    }
}
