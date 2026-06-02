<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class DayWiseReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'agents' => $this->formatAgents($this->resource['agents']),
            'dates' => $this->resource['dates'],
            'meta' => [
                'total_agents' => $this->resource['total_agents'],
                'total_days' => $this->resource['total_days'],
            ],
        ];
    }

    private function formatAgents(array $agents): array
    {
        return array_map(function ($agent) {
            return [
                'agent_id' => $agent['agent_id'],
                'agent_name' => $agent['agent_name'],
                'employee_code' => $agent['employee_code'],
                'daily_stats' => $this->formatDailyStats($agent['daily_stats']),
                'period_total' => [
                    'total_calls' => $agent['period_total']['total_calls'],
                    'connected' => $agent['period_total']['connected'],
                    'missed' => $agent['period_total']['missed'],
                    'total_duration' => $this->formatDuration($agent['period_total']['total_duration']),
                    'total_duration_seconds' => $agent['period_total']['total_duration'],
                ],
            ];
        }, $agents);
    }

    private function formatDailyStats(array $dailyStats): array
    {
        return array_map(function ($stats) {
            return [
                'total_calls' => $stats['total_calls'],
                'connected' => $stats['connected'],
                'missed' => $stats['missed'],
                'total_duration' => $this->formatDuration($stats['total_duration']),
                'total_duration_seconds' => $stats['total_duration'],
                'first_call_time' => $stats['first_call_time']
                    ? \Carbon\Carbon::parse($stats['first_call_time'])->format('h:i A')
                    : null,
            ];
        }, $dailyStats);
    }

    private function formatDuration(int $seconds): string
    {
        if ($seconds === 0) {
            return '0h 0m';
        }

        $hours = floor($seconds / 3600);
        $minutes = floor(($seconds % 3600) / 60);

        if ($hours > 0) {
            return "{$hours}h {$minutes}m";
        }

        return "{$minutes}m";
    }
}
