<?php

declare(strict_types=1);

namespace App\Contracts\Services;

use App\Domain\Calls\DTOs\SyncCallLogsDTO;

interface CallSyncServiceInterface
{
    /**
     * @return array{ingested: int, skipped: int, skipped_slots: int[]}
     */
    public function sync(SyncCallLogsDTO $dto): array;
}
