<?php

declare(strict_types=1);

namespace App\DTOs\Calls;

use App\Domain\Users\Models\User;

final readonly class UpdateCallNoteDTO
{
    public function __construct(
        public int $callLogId,
        public string $note,
        public User $user,
    ) {}
}
