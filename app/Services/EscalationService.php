<?php

declare(strict_types=1);

namespace App\Services;

use App\Actions\Calls\CreatePendingEscalationAction;
use App\Actions\Calls\FlagOverdueEscalationsAction;
use App\Actions\Calls\GetEscalationInsightsAction;
use App\Actions\Calls\GetEscalationSummaryAction;
use App\Actions\Calls\NotifyUnattendedEscalationsAction;
use App\Actions\Calls\ResolveEscalationAction;
use App\Contracts\Services\EscalationServiceContract;
use App\Domain\Calls\DTOs\EscalationFilterDTO;
use App\Domain\Calls\Models\CallLog;
use Illuminate\Pagination\LengthAwarePaginator;

class EscalationService implements EscalationServiceContract
{
    public function __construct(
        private CreatePendingEscalationAction $createPendingEscalationAction,
        private FlagOverdueEscalationsAction $flagOverdueEscalationsAction,
        private ResolveEscalationAction $resolveEscalationAction,
        private GetEscalationInsightsAction $getEscalationInsightsAction,
        private GetEscalationSummaryAction $getEscalationSummaryAction,
        private NotifyUnattendedEscalationsAction $notifyUnattendedEscalationsAction
    ) {}

    public function handleMissedCall(int $callLogId): void
    {
        $callLog = CallLog::find($callLogId);

        if (! $callLog) {
            return;
        }

        $this->createPendingEscalationAction->execute($callLog);
    }

    public function processOverdueSlas(): int
    {
        return $this->flagOverdueEscalationsAction->execute();
    }

    public function attemptResolutionFromOutgoingCall(int $callLogId): int
    {
        $callLog = CallLog::find($callLogId);

        if (! $callLog) {
            return 0;
        }

        return $this->resolveEscalationAction->execute($callLog);
    }

    public function getEscalationInsights(EscalationFilterDTO $dto): LengthAwarePaginator
    {
        return $this->getEscalationInsightsAction->execute($dto);
    }

    public function getEscalationSummary(EscalationFilterDTO $dto): array
    {
        return $this->getEscalationSummaryAction->execute($dto);
    }

    public function notifyUnattendedEscalations(): int
    {
        return $this->notifyUnattendedEscalationsAction->execute();
    }
}
