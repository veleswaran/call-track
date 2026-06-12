<?php

declare(strict_types=1);

namespace App\Contracts\Services;

use App\Domain\Calls\DTOs\EscalationFilterDTO;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Contract for exporting missed call escalations as CSV for the Admin API.
 */
interface MissedCallExportServiceContract
{
    /**
     * Stream a CSV download of missed call escalations matching the given filters.
     */
    public function export(EscalationFilterDTO $dto): StreamedResponse;
}
