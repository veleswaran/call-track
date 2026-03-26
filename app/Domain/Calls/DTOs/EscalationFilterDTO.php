<?php

declare(strict_types=1);

namespace App\Domain\Calls\DTOs;

use Illuminate\Http\Request;

class EscalationFilterDTO
{
    public function __construct(
        public ?int $team_id = null,
        public ?int $agent_id = null,
        public string|array|null $status = null, // pending, unattended, resolved
        public ?string $date_from = null,
        public ?string $date_to = null,
        public int $per_page = 20,
        /** @var int[]|null Null = full access, array = restricted agent IDs */
        public ?array $allowed_agent_ids = null,
        public ?string $contact_filter = null,
    ) {}

    public static function fromRequest(Request $request, ?array $allowed_agent_ids = null): self
    {
        return new self(
            team_id: $request->filled('team_id') ? (int) $request->input('team_id') : null,
            agent_id: $request->filled('agent_id') ? (int) $request->input('agent_id') : null,
            status: $request->input('status'),
            date_from: $request->input('date_from'),
            date_to: $request->input('date_to'),
            per_page: (int) $request->input('per_page', 20),
            allowed_agent_ids: $allowed_agent_ids,
            contact_filter: $request->string('contact_filter')->toString() ?: null,
        );
    }
}
