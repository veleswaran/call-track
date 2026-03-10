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
            $query->where('status', $dto->status);
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

        if ($dto->team_id) {
            $query->whereHas('callLog.agent.teams', function ($q) use ($dto) {
                $q->where('teams.id', $dto->team_id);
            });
        }

        return $query;
    }
}
