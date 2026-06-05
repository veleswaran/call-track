<?php

declare(strict_types=1);

namespace App\Services;

use App\Actions\Calls\ExportCallLogsAction;
use App\Contracts\Services\CallLogExportServiceContract;
use App\Domain\Calls\DTOs\ListCallLogsDTO;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Orchestrates streaming CSV export of call logs for the Admin API.
 */
final class CallLogExportService implements CallLogExportServiceContract
{
    public function __construct(
        private readonly ExportCallLogsAction $exportAction,
    ) {}

    public function export(ListCallLogsDTO $dto): StreamedResponse
    {
        return $this->exportAction->execute($dto);
    }
}
