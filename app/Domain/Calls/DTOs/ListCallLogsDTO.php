<?php

declare(strict_types=1);

namespace App\Domain\Calls\DTOs;

use App\Http\Requests\Admin\IndexCallLogsRequest;

/**
 * Immutable DTO carrying pagination and filter inputs for listing call logs.
 */
final readonly class ListCallLogsDTO
{
    public function __construct(
        public int $page,
        public int $perPage,
        public ?int $deviceId = null,
        // Arrays for multi-select
        public array $agentIds = [],
        public array $callTypes = [], // incoming, outgoing, missed
        public array $classifications = [], // business, personal, ignored
        public array $statuses = [], // Connected, Missed, No Answer

        public ?string $dateFrom = null,
        public ?string $dateTo = null,
        public ?string $search = null,
        public ?\App\Domain\Users\Models\User $user = null,
        public ?int $teamId = null,
        /** @var int[]|null Null = full access, array = restricted to these agent IDs */
        public ?array $allowedAgentIds = null,
    ) {
    }

    public static function fromRequest(IndexCallLogsRequest $request): self
    {
        $page = (int) ($request->integer('page') ?: 1);
        $perPage = (int) ($request->integer('per_page') ?: 15);

        // Normalize legacy single inputs to arrays
        $agentIds = $request->input('agents', []);
        if (empty($agentIds) && $agentId = $request->integer('agent_id')) {
            $agentIds = [$agentId];
        }

        $callTypes = $request->input('types', []);
        if (empty($callTypes) && $type = $request->input('call_type')) {
            $callTypes = [$type];
        }

        $classifications = $request->input('classifications', []);
        if (empty($classifications) && $cls = $request->input('classification')) {
            $classifications = [$cls];
        }

        // Map start_date/end_date to dateFrom/dateTo
        $dateFrom = $request->input('start_date') ?? $request->input('date_from');
        $dateTo = $request->input('end_date') ?? $request->input('date_to');

        return new self(
            page: $page,
            perPage: $perPage,
            deviceId: $request->integer('device_id') ?: null,
            agentIds: array_map('intval', (array) $agentIds),
            callTypes: (array) $callTypes,
            classifications: (array) $classifications,
            statuses: (array) $request->input('statuses', []),
            dateFrom: $dateFrom ? (string) $dateFrom : null,
            dateTo: $dateTo ? (string) $dateTo : null,
            search: $request->string('search')->toString() ?: null,
            user: $request->user(),
            teamId: $request->integer('team_id') ?: null,
        );
    }
}
