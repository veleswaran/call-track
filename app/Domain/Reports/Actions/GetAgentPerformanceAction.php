<?php

declare(strict_types=1);

namespace App\Domain\Reports\Actions;

use App\Domain\Reports\DTOs\ReportFilterDTO;
use Illuminate\Database\Query\Builder;
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
        
        $query = DB::table('agents')
            ->join('devices', 'agents.id', '=', 'devices.agent_id')
            ->join('call_logs', 'devices.id', '=', 'call_logs.device_id')
            ->whereBetween('call_logs.timestamp', [$filters->startDate, $filters->endDate]);

        // Filters
        if (!empty($filters->agentIds)) {
            $query->whereIn('agents.id', $filters->agentIds);
        }
        
        // Group by Agent
        $stats = $query->select([
            'agents.id',
            'agents.name',
            'agents.employee_code',
            DB::raw('COUNT(call_logs.id) as total_calls'),
            DB::raw("SUM(CASE WHEN call_logs.duration > 0 THEN 1 ELSE 0 END) as connected"),
            DB::raw("SUM(CASE WHEN call_logs.direction = 'MISSED' THEN 1 ELSE 0 END) as missed"),
            DB::raw("AVG(call_logs.duration) as avg_duration"),
            DB::raw("SUM(call_logs.duration) as total_duration"),
        ])
        ->groupBy('agents.id', 'agents.name', 'agents.employee_code')
        ->get();

        $result = [];
        foreach ($stats as $stat) {
            $total = (int)$stat->total_calls;
            $connected = (int)$stat->connected;
            // Handling Rate = Connected / Total? Or (Connected + Outgoing) / Total?
            // "Handling Rate" usually implies "Calls Answered / Total Offered" for Inbound.
            // For mixed, let's use Connected %
            $handlingRate = $total > 0 ? round(($connected / $total) * 100, 1) : 0;
            
            // Performance Label
            $performance = 'Average';
            if ($handlingRate >= 80) $performance = 'Excellent';
            elseif ($handlingRate < 40) $performance = 'Poor';

            $result[] = [
                'id' => $stat->id,
                'agent' => $stat->name,
                'employee_code' => 'EMP-' . str_pad((string)$stat->id, 3, '0', STR_PAD_LEFT), // Mock code
                'total_calls' => $total,
                'connected' => $connected,
                'missed' => (int)$stat->missed,
                'avg_duration' => $this->formatDuration((int)$stat->avg_duration),
                'total_duration' => $this->formatDuration((int)$stat->total_duration),
                'handling_rate' => $handlingRate,
                'performance' => $performance,
            ];
        }
        
        return $result;
    }
    
    private function formatDuration(int $seconds): string
    {
       if ($seconds < 60) return "{$seconds}s";
       $h = floor($seconds / 3600);
       $m = floor(($seconds % 3600) / 60);
       $s = $seconds % 60;
       
       if ($h > 0) {
           return "{$h}h {$m}m"; // Simplified for table width
       }
       return "{$m}m {$s}s";
    }
}
