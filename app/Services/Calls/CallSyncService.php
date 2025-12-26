<?php

declare(strict_types=1);

namespace App\Services\Calls;

use App\Contracts\Services\CallSyncServiceInterface;
use App\Actions\Calls\IngestCallLogsAction;
use App\Domain\Calls\DTOs\SyncCallLogsDTO;
use Illuminate\Support\Facades\Log;

class CallSyncService implements CallSyncServiceInterface
{
    public function __construct(
        protected IngestCallLogsAction $ingestAction
    ) {}

    public function sync(SyncCallLogsDTO $dto): void
    {
        // "services use contracts... services orchestrate"
        // Here we just delegate to Action.
        // We could also log here.
        
        Log::info("Syncing calls for device: {$dto->device->id}", [
            'count' => count($dto->logs)
        ]);

        $this->ingestAction->execute($dto);
    }
}
