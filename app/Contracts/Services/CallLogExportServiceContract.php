<?php

declare(strict_types=1);

namespace App\Contracts\Services;

use App\Domain\Calls\DTOs\ListCallLogsDTO;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Contract for exporting call logs as CSV for the Admin API.
 */
interface CallLogExportServiceContract
{
    /**
     * Stream a CSV download of call logs matching the given filters.
     */
    public function export(ListCallLogsDTO $dto): StreamedResponse;
}
