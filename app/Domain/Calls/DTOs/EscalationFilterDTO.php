<?php

declare(strict_types=1);

namespace App\Domain\Calls\DTOs;

use Illuminate\Http\Request;

class EscalationFilterDTO
{
    public function __construct(
        public readonly array $team_ids = [],
        public readonly ?int $agent_id = null,
        public readonly string|array|null $status = null, // pending, unattended, resolved
        public readonly ?string $date_from = null,
        public readonly ?string $date_to = null,
        public readonly int $per_page = 20,
        /** @var int[]|null Null = full access, array = restricted agent IDs */
        public readonly ?array $allowed_agent_ids = null,
        public readonly ?string $contact_filter = null,
        public readonly ?array $types = null,
        public readonly ?int $sim_slot = null,
    ) {}

    public static function fromRequest(Request $request, ?array $allowed_agent_ids = null): self
    {
        return new self(
            team_ids: array_map('intval', (array) ($request->input('team_ids') ?? ($request->has('team_id') ? [$request->input('team_id')] : []))),
            agent_id: $request->filled('agent_id') ? (int) $request->input('agent_id') : null,
            status: $request->input('status'),
            date_from: $request->input('date_from'),
            date_to: $request->input('date_to'),
            per_page: (int) $request->input('per_page', 20),
            allowed_agent_ids: $allowed_agent_ids,
            contact_filter: $request->string('contact_filter')->toString() ?: null,
            types: $request->input('types'),
            sim_slot: $request->filled('sim_slot') ? (int) $request->input('sim_slot') : null,
        );
    }
}
