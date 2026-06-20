<?php

declare(strict_types=1);

namespace App\Actions\Calls;

use App\Domain\Calls\DTOs\EscalationFilterDTO;
use App\Domain\Calls\Models\CallEscalation;

class GetEscalationSummaryByAgentAction
{
    public function __construct(private readonly GetEscalationInsightsAction $insightsAction) {}

    /**
     * @return array<int, array{agent_id: int, agent_name: string, employee_code: string|null, total_missed: int, pending: int, unattended: int, resolved: int}>
     */
    public function execute(EscalationFilterDTO $dto): array
    {
        $summaryDto = clone $dto;
        $summaryDto->status = null;

        $baseQuery = CallEscalation::query();
        $baseQuery = $this->insightsAction->applyFilters($baseQuery, $summaryDto);

        $rows = $baseQuery
            ->join('call_logs', 'call_escalations.call_log_id', '=', 'call_logs.id')
            ->join('agents', 'call_logs.agent_id', '=', 'agents.id')
            ->selectRaw('agents.id AS agent_id, agents.name AS agent_name, agents.employee_code AS employee_code, call_escalations.status AS escalation_status, COUNT(*) AS status_count')
            ->groupBy('agents.id', 'agents.name', 'agents.employee_code', 'call_escalations.status')
            ->toBase()
            ->get();

        $byAgent = [];

        foreach ($rows as $row) {
            $agentId = (int) $row->agent_id;

            if (! isset($byAgent[$agentId])) {
                $byAgent[$agentId] = [
                    'agent_id' => $agentId,
                    'agent_name' => (string) $row->agent_name,
                    'employee_code' => ($row->employee_code !== null && $row->employee_code !== '') ? (string) $row->employee_code : null,
                    'total_missed' => 0,
                    'pending' => 0,
                    'unattended' => 0,
                    'resolved' => 0,
                ];
            }

            $count = (int) $row->status_count;
            $byAgent[$agentId]['total_missed'] += $count;

            $status = $row->escalation_status;
            if ($status === 'pending' || $status === 'unattended' || $status === 'resolved') {
                $byAgent[$agentId][$status] += $count;
            }
        }

        usort($byAgent, fn ($a, $b) => $b['total_missed'] <=> $a['total_missed']);

        return $byAgent;
    }
}
