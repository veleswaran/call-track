<?php

declare(strict_types=1);

namespace App\Actions\Calls;

use App\Domain\Calls\DTOs\EscalationFilterDTO;
use App\Domain\Calls\Models\CallEscalation;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;

class GetEscalationInsightsAction
{
    public function __construct(
        protected \App\Actions\Contacts\GetContactHashVariationsAction $getContactHashesAction
    ) {}

    public function execute(EscalationFilterDTO $dto): LengthAwarePaginator
    {
        $query = CallEscalation::with(['callLog', 'callLog.agent', 'callLog.device', 'resolvedByCall']);

        $query = $this->applyFilters($query, $dto);

        // Ensure newest escalations are at the top
        $query->orderBy('response_due_at', 'desc');

        return $query->paginate($dto->per_page);
    }

    public function applyFilters(Builder $query, EscalationFilterDTO $dto): Builder
    {
        // Personal calls are excluded from reports per PRD
        $query->whereHas('callLog', function ($q) {
            $q->whereDoesntHave('classification', function ($cq) {
                $cq->where('type', 'personal');
            });
        });

        if ($dto->status) {
            if (is_array($dto->status)) {
                $query->whereIn('status', $dto->status);
            } else {
                $query->where('status', $dto->status);
            }
        }

        if ($dto->date_from) {
            $query->whereHas('callLog', function ($q) use ($dto) {
                $q->where('timestamp', '>=', Carbon::parse($dto->date_from)->startOfDay());
            });
        }

        if ($dto->date_to) {
            $query->whereHas('callLog', function ($q) use ($dto) {
                $q->where('timestamp', '<=', Carbon::parse($dto->date_to)->endOfDay());
            });
        }

        if ($dto->agent_id) {
            $query->whereHas('callLog', function ($q) use ($dto) {
                $q->where('agent_id', $dto->agent_id);
            });
        }

        if (! empty($dto->team_ids)) {
            $query->whereHas('callLog.agent.teams', function ($q) use ($dto) {
                $q->whereIn('teams.id', $dto->team_ids);
            });
        }

        if (is_array($dto->allowed_agent_ids)) {
            $query->whereHas('callLog', function ($q) use ($dto) {
                $q->whereIn('agent_id', $dto->allowed_agent_ids);
            });
        }

        if ($dto->contact_filter !== null && $dto->contact_filter !== 'all') {
            $contactHashes = $this->getContactHashesAction->execute();

            if ($dto->contact_filter === 'internal') {
                $query->whereHas('callLog', function ($q) use ($contactHashes) {
                    $q->whereIn('phone_number_hash', $contactHashes);
                });
            } else {
                $query->whereHas('callLog', function ($q) use ($contactHashes) {
                    $q->whereNotIn('phone_number_hash', $contactHashes);
                });
            }
        }

        return $query;
    }
}
