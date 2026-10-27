<?php

declare(strict_types=1);

namespace App\Domain\Reports\Actions;

use App\Domain\Calls\Models\CallLog;
use App\Domain\Reports\DTOs\CustomerSummaryFilterDTO;
use Illuminate\Support\Facades\DB;

final class GetCustomerSummaryMetricsAction
{
    /**
     * @return array<string, mixed>
     */
    public function execute(CustomerSummaryFilterDTO $filters): array
    {
        $query = DB::table('call_logs')
            ->join('devices', 'devices.id', '=', 'call_logs.device_id')
            ->leftJoin('agents', 'agents.id', '=', DB::raw('COALESCE(call_logs.agent_id, devices.agent_id)'));

        if ($filters->startDate && $filters->endDate) {
            $query->whereBetween('call_logs.timestamp', [
                $filters->startDate->copy()->startOfDay(),
                $filters->endDate->copy()->endOfDay(),
            ]);
        }

        if ($filters->allowedAgentIds !== null) {
            if (empty($filters->allowedAgentIds)) {
                return $this->emptyMetrics();
            }
            $query->whereIn('agents.id', $filters->allowedAgentIds);
        }

        if (! empty($filters->agentIds)) {
            $query->whereIn('agents.id', $filters->agentIds);
        }

        if (! empty($filters->teamIds)) {
            $query->whereIn('agents.id', function ($q) use ($filters) {
                $q->select('agent_id')
                    ->from('team_members')
                    ->whereIn('team_id', $filters->teamIds);
            });
        }

        if (! empty($filters->types)) {
            $query->leftJoin('call_classifications as cc', 'call_logs.id', '=', 'cc.call_log_id')
                ->whereIn('cc.type', array_map('strtoupper', $filters->types));
        }

        if ($filters->simSlot !== null) {
            $query->where('call_logs.sim_slot', $filters->simSlot);
        }

        $missedSql = CallLog::SQL_MISSED_CONDITION;
        $connectedSql = CallLog::SQL_CONNECTED_CONDITION;

        $stats = $query->selectRaw("
            COUNT(DISTINCT call_logs.phone_number_hash) as total_accounts,
            COUNT(call_logs.id) as total_calls,
            COUNT(CASE WHEN {$connectedSql} THEN 1 END) as connected_calls,
            COALESCE(SUM(call_logs.duration), 0) as total_duration,
            COUNT(CASE WHEN {$missedSql} THEN 1 END) as missed_calls,
            COUNT(CASE WHEN EXISTS (
                SELECT 1 FROM call_escalations ce 
                WHERE ce.call_log_id = call_logs.id AND ce.status IN ('pending', 'unattended')
            ) THEN 1 END) as pending_missed_calls,
            COUNT(CASE WHEN EXISTS (
                SELECT 1 FROM call_escalations ce 
                WHERE ce.call_log_id = call_logs.id AND ce.status = 'pending'
            ) THEN 1 END) as sla_pending_count,
            COUNT(CASE WHEN EXISTS (
                SELECT 1 FROM call_escalations ce 
                WHERE ce.call_log_id = call_logs.id AND ce.status = 'unattended'
            ) THEN 1 END) as unattended_count,
            COUNT(CASE WHEN EXISTS (
                SELECT 1 FROM call_escalations ce 
                WHERE ce.call_log_id = call_logs.id AND ce.status = 'resolved'
            ) THEN 1 END) as auto_resolved_count
        ")->first();

        $totalAccounts = (int) ($stats->total_accounts ?? 0);
        $totalCalls = (int) ($stats->total_calls ?? 0);
        $connectedCalls = (int) ($stats->connected_calls ?? 0);
        $totalDuration = (int) ($stats->total_duration ?? 0);
        $missedCalls = (int) ($stats->missed_calls ?? 0);
        $pendingMissedCalls = (int) ($stats->pending_missed_calls ?? 0);
        $slaPending = (int) ($stats->sla_pending_count ?? 0);
        $unattended = (int) ($stats->unattended_count ?? 0);
        $autoResolved = (int) ($stats->auto_resolved_count ?? 0);

        $connectedPct = $totalCalls > 0 ? round(($connectedCalls / $totalCalls) * 100, 1) : 0.0;

        return [
            'total_accounts' => $totalAccounts,
            'total_calls' => $totalCalls,
            'connected_calls' => $connectedCalls,
            'connected_pct' => $connectedPct,
            'total_talk_time' => $this->formatDuration($totalDuration),
            'total_talk_time_raw' => $totalDuration,
            'missed_calls' => $missedCalls,
            'pending_missed_calls' => $pendingMissedCalls,
            'sla_pending_count' => $slaPending,
            'unattended_count' => $unattended,
            'auto_resolved_count' => $autoResolved,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function emptyMetrics(): array
    {
        return [
            'total_accounts' => 0,
            'total_calls' => 0,
            'connected_calls' => 0,
            'connected_pct' => 0.0,
            'total_talk_time' => '0m',
            'total_talk_time_raw' => 0,
            'missed_calls' => 0,
            'pending_missed_calls' => 0,
            'sla_pending_count' => 0,
            'unattended_count' => 0,
            'auto_resolved_count' => 0,
        ];
    }

    private function formatDuration(int $seconds): string
    {
        if ($seconds < 60) {
            return "{$seconds}s";
        }
        $hours = floor($seconds / 3600);
        $mins = floor(($seconds % 3600) / 60);

        if ($hours > 0) {
            return "{$hours}h {$mins}m";
        }

        return "{$mins}m";
    }
}
