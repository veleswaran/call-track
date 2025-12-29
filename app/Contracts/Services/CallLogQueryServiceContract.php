<?php

declare(strict_types=1);

namespace App\Contracts\Services;

use App\Domain\Calls\DTOs\ListCallLogsDTO;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * Contract for querying call logs for the Admin API.
 */
interface CallLogQueryServiceContract
{
    /**
     * Returns a paginated list of call logs matching the given filters.
     */
    public function list(ListCallLogsDTO $dto): LengthAwarePaginator;
}
