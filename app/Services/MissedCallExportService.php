<?php

declare(strict_types=1);

namespace App\Services;

use App\Actions\Calls\ExportMissedCallsAction;
use App\Contracts\Services\MissedCallExportServiceContract;
use App\Domain\Calls\DTOs\EscalationFilterDTO;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Orchestrates streaming CSV export of missed call escalations for the Admin API.
 */
final class MissedCallExportService implements MissedCallExportServiceContract
{
    public function __construct(
        private readonly ExportMissedCallsAction $exportAction,
    ) {}

    public function export(EscalationFilterDTO $dto): StreamedResponse
    {
        return $this->exportAction->execute($dto);
    }
}
