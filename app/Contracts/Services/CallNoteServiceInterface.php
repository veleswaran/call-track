<?php

declare(strict_types=1);

namespace App\Contracts\Services;

use App\Domain\Classification\Models\CallNote;
use App\DTOs\Calls\UpdateCallNoteDTO;

interface CallNoteServiceInterface
{
    public function updateCallNote(UpdateCallNoteDTO $dto): CallNote;
}
