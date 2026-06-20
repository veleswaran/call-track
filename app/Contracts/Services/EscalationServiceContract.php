<?php

declare(strict_types=1);

namespace App\Contracts\Services;

use App\Domain\Calls\DTOs\EscalationFilterDTO;
use Illuminate\Pagination\LengthAwarePaginator;

interface EscalationServiceContract
{
    /**
     * Handle the ingestion of a missed call by evaluating SLAs and queuing escalations.
     */
    public function handleMissedCall(int $callLogId): void;

    /**
     * Process background SLA calculations to flag escalations past due as unattended.
     */
    public function processOverdueSlas(): int;

    /**
     * Attempt to resolve any pending/unattended escalations from a successful back-and-forth outgoing phone call.
     */
    public function attemptResolutionFromOutgoingCall(int $callLogId): int;

    /**
     * Retrieve a paginated list of escalations for the dashboard.
     */
    public function getEscalationInsights(EscalationFilterDTO $dto): LengthAwarePaginator;

    /**
     * Get summary metrics for the Escalation dashboard (counts of pending, unattended, resolved, etc.)
     */
    public function getEscalationSummary(EscalationFilterDTO $dto): array;

    /**
     * Get per-agent summary metrics (total, pending, unattended, resolved counts).
     *
     * @return array<int, array{agent_id: int, agent_name: string, total_missed: int, pending: int, unattended: int, resolved: int}>
     */
    public function getEscalationSummaryByAgent(EscalationFilterDTO $dto): array;

    /**
     * Notify devices of unattended missed call escalations via FCM.
     */
    public function notifyUnattendedEscalations(): int;
}
