<?php

declare(strict_types=1);

namespace App\Services\Calls;

use App\Actions\Classification\UpdateCallNoteAction;
use App\Contracts\Services\CallNoteServiceInterface;
use App\Domain\Calls\Models\CallLog;
use App\Domain\Classification\Models\CallNote;
use App\DTOs\Calls\UpdateCallNoteDTO;

class CallNoteService implements CallNoteServiceInterface
{
    public function __construct(
        protected UpdateCallNoteAction $updateCallNoteAction
    ) {}

    public function updateCallNote(UpdateCallNoteDTO $dto): CallNote
    {
        $callLog = CallLog::findOrFail($dto->callLogId);

        return $this->updateCallNoteAction->execute(
            $callLog,
            $dto->note,
            $dto->user
        );
    }
}
