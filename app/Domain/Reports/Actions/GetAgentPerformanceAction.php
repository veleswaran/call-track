<?php

declare(strict_types=1);

namespace App\Domain\Reports\Actions;

use App\Domain\Reports\DTOs\ReportFilterDTO;
use Illuminate\Support\Facades\DB;

final class GetAgentPerformanceAction
{
    public function execute(ReportFilterDTO $filters): array
    {
        // Should join users/agents.
        // Assuming 'agents' are Users with specific role or just Users linked to Devices.
        // Devices have `agent_id` which might link to `users.id` (based on Laravel convention) or `agents` table.
        // Let's check `Device` model relationships later to be sure.
        // Assuming `agent_id` -> `users` (Admin is User, Agent is User).

        $query = \App\Domain\Agents\Models\Agent::query()
            ->join('devices', 'agents.id', '=', 'devices.agent_id')
            ->join('call_logs', 'devices.id', '=', 'call_logs.device_id')
            ->leftJoin('call_classifications', 'call_logs.id', '=', 'call_classifications.call_log_id')
            ->whereBetween('call_logs.timestamp', [$filters->startDate, $filters->endDate]);

        // RBAC scope - security constraint
        if ($filters->allowedAgentIds !== null) {
            if (empty($filters->allowedAgentIds)) {
                // No access
                return [];
            }
            $query->whereIn('agents.id', $filters->allowedAgentIds);
        }

        // User-selected agent filter
        if (! empty($filters->agentIds)) {
            $query->whereIn('agents.id', $filters->agentIds);
        }

        // Apply team filter
        if (! empty($filters->teamIds)) {
            $query->whereIn('agents.id', function ($q) use ($filters) {
                $q->select('agent_id')
                    ->from('team_members')
                    ->whereIn('team_id', $filters->teamIds);
            });
        }

        // Filter by Classification (mapped from 'types' in DTO)
        if (! empty($filters->types)) {
            // Frontend sends BUSINESS/PERSONAL. Column in CallClassification is 'type'.
            $query->whereIn('call_classifications.type', array_map('strtoupper', $filters->types));
        }

        // Filter by Call Outcomes
        if (! empty($filters->outcomes)) {
            $query->where(function ($q) use ($filters) {
                foreach ($filters->outcomes as $outcome) {
                    $q->orWhere(function ($sub) use ($outcome) {
                        switch (strtoupper($outcome)) {
                            case 'CONNECTED':
                                $sub->where('call_logs.duration', '>', 0);
                                break;
                            case 'MISSED':
                                $sub->where(function ($inner) {
                                    $inner->whereIn('call_logs.direction', ['MISSED', 'REJECTED', 'BLOCKED'])
                                        ->orWhere(function ($inc) {
                                            $inc->where('call_logs.direction', 'INCOMING')->where('call_logs.duration', 0);
                                        });
                                });
                                break;
                            case 'NO_ANSWER':
                                $sub->where('call_logs.direction', 'OUTGOING')
                                    ->where('call_logs.duration', 0);
                                break;
                        }
                    });
                }
            });
        }

        // Group by Agent
        $stats = $query->select([
            'agents.id',
            'agents.name',
            'agents.employee_code',
            DB::raw('COUNT(call_logs.id) as total_calls'),
            DB::raw('SUM(CASE WHEN call_logs.duration > 0 THEN 1 ELSE 0 END) as connected'),
            DB::raw("SUM(CASE WHEN call_logs.direction IN ('MISSED', 'REJECTED', 'BLOCKED') OR (call_logs.direction = 'INCOMING' AND call_logs.duration = 0) THEN 1 ELSE 0 END) as missed"),
            DB::raw('AVG(call_logs.duration) as avg_duration'),
            DB::raw('SUM(call_logs.duration) as total_duration'),
        ])
            ->groupBy('agents.id', 'agents.name', 'agents.employee_code')
            ->toBase()
            ->get();

        $result = [];
        foreach ($stats as $stat) {
            $total = (int) $stat->total_calls;
            $connected = (int) $stat->connected;
            // Handling Rate = Connected / Total? Or (Connected + Outgoing) / Total?
            // "Handling Rate" usually implies "Calls Answered / Total Offered" for Inbound.
            // For mixed, let's use Connected %
            $handlingRate = $total > 0 ? round(($connected / $total) * 100, 1) : 0;

            // Performance Label
            $performance = 'Average';
            if ($handlingRate >= 80) {
                $performance = 'Excellent';
            } elseif ($handlingRate < 40) {
                $performance = 'Poor';
            }

            $result[] = [
                'id' => $stat->id,
                'agent' => $stat->name,
                'employee_code' => 'EMP-'.str_pad((string) $stat->id, 3, '0', STR_PAD_LEFT), // Mock code
                'total_calls' => $total,
                'connected' => $connected,
                'missed' => (int) $stat->missed,
                'avg_duration' => $this->formatDuration((int) $stat->avg_duration),
                'total_duration' => $this->formatDuration((int) $stat->total_duration),
                'handling_rate' => $handlingRate,
                'performance' => $performance,
            ];
        }

        return $result;
    }

    private function formatDuration(int $seconds): string
    {
        if ($seconds < 60) {
            return "{$seconds}s";
        }
        $h = floor($seconds / 3600);
        $m = floor(($seconds % 3600) / 60);
        $s = $seconds % 60;

        if ($h > 0) {
            return "{$h}h {$m}m"; // Simplified for table width
        }

        return "{$m}m {$s}s";
    }
}
