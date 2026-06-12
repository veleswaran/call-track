<?php

declare(strict_types=1);

namespace App\Contracts\Services;

use App\Http\Requests\ExportMissedCallsRequest;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Contract for exporting missed call escalations as CSV for the Admin API.
 */
interface MissedCallExportServiceContract
{
    /**
     * Stream a CSV download of missed call escalations matching the request filters.
     */
    public function export(ExportMissedCallsRequest $request): StreamedResponse;
}
