<?php

declare(strict_types=1);

namespace App\Contracts\Services;

use App\Domain\Calls\DTOs\SyncCallLogsDTO;

interface CallSyncServiceInterface
{
    public function sync(SyncCallLogsDTO $dto): void;
}
