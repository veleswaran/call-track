<?php

declare(strict_types=1);

namespace App\Domain\Reports\Actions;

use App\Domain\Reports\DTOs\ReportFilterDTO;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

final class GetReportChartsAction
{
    public function execute(ReportFilterDTO $filters): array
    {
        return [
            'calls_per_day' => $this->getCallsPerDay($filters),
            'status_distribution' => $this->getStatusDistribution($filters),
            'peak_call_hours' => $this->getPeakCallHours($filters),
            'caller_types' => $this->getCallerTypeBreakdown($filters),
            'call_direction_distribution' => $this->getCallDirectionDistribution($filters),
        ];
    }

    private function getBaseQuery(ReportFilterDTO $filters): Builder
    {
        $query = DB::table('call_logs')
            ->leftJoin('call_classifications', 'call_logs.id', '=', 'call_classifications.call_log_id')
            ->whereBetween('call_logs.timestamp', [$filters->startDate, $filters->endDate]);

        if (! empty($filters->agentIds)) {
            $query->join('devices', 'call_logs.device_id', '=', 'devices.id')
                ->whereIn('devices.agent_id', $filters->agentIds);
        }
        if (! empty($filters->types)) {
            $query->whereIn('call_classifications.type', $filters->types);
        }
        // Helper to apply status filters if needed, but charts usually show ALL statuses unless specifically filtered.
        // For consistency, we should apply them.
        if (! empty($filters->statuses)) {
            $query->where(function ($q) use ($filters) {
                foreach ($filters->statuses as $status) {
                    switch ($status) {
                        case 'MISSED':
                            $q->orWhere('call_logs.direction', 'MISSED');
                            break;
                        case 'NO_ANSWER':
                            $q->orWhere(function ($sq) {
                                $sq->where('call_logs.direction', 'OUTGOING')
                                    ->where('call_logs.duration', 0);
                            });
                            break;
                        case 'CONNECTED':
                            $q->orWhere('call_logs.duration', '>', 0);
                            break;
                    }
                }
            });
        }

        return $query;
    }

    private function getCallsPerDay(ReportFilterDTO $filters): array
    {
        $data = $this->getBaseQuery($filters)
            ->selectRaw("
                DATE(call_logs.timestamp) as date,
                SUM(CASE WHEN call_logs.direction = 'MISSED' THEN 1 ELSE 0 END) as missed,
                SUM(CASE WHEN call_logs.direction = 'OUTGOING' AND call_logs.duration = 0 THEN 1 ELSE 0 END) as no_answer,
                SUM(CASE WHEN call_logs.duration > 0 THEN 1 ELSE 0 END) as connected
            ")
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Fill missing dates
        $period = new \DatePeriod(
            $filters->startDate->copy()->startOfDay(),
            new \DateInterval('P1D'),
            $filters->endDate->copy()->endOfDay()
        );

        $result = [];
        $keyedData = $data->keyBy('date');

        foreach ($period as $date) {
            $dateStr = $date->format('Y-m-d');
            $record = $keyedData[$dateStr] ?? null;

            $result[] = [
                'date' => $date->format('d M'), // Display format e.g. 05 Jan
                'connected' => $record ? (int) $record->connected : 0,
                'missed' => $record ? (int) $record->missed : 0,
                'no_answer' => $record ? (int) $record->no_answer : 0,
            ];
        }

        return $result;
    }

    private function getStatusDistribution(ReportFilterDTO $filters): array
    {
        // Status derived: Missed, Connected, No Answer
        $stats = $this->getBaseQuery($filters)
            ->selectRaw("
                SUM(CASE WHEN call_logs.direction = 'MISSED' THEN 1 ELSE 0 END) as missed,
                SUM(CASE WHEN call_logs.direction = 'OUTGOING' AND call_logs.duration = 0 THEN 1 ELSE 0 END) as no_answer,
                SUM(CASE WHEN call_logs.duration > 0 THEN 1 ELSE 0 END) as connected
            ")
            ->first();

        return [
            ['name' => 'Connected', 'value' => (int) ($stats->connected ?? 0), 'fill' => '#22c55e'], // Green
            ['name' => 'Missed', 'value' => (int) ($stats->missed ?? 0), 'fill' => '#ef4444'],   // Red
            ['name' => 'No Answer', 'value' => (int) ($stats->no_answer ?? 0), 'fill' => '#eab308'], // Yellow
        ];
    }

    private function getPeakCallHours(ReportFilterDTO $filters): array
    {
        $driver = DB::connection()->getDriverName();
        $hourExpression = $driver === 'sqlite'
            ? "CAST(strftime('%H', call_logs.timestamp) AS INTEGER)"
            : 'EXTRACT(HOUR FROM call_logs.timestamp)';

        $data = $this->getBaseQuery($filters)
            ->selectRaw("$hourExpression as hour, COUNT(*) as count")
            ->groupBy('hour')
            ->orderBy('hour')
            ->get();

        $result = [];
        $keyedData = $data->keyBy('hour');

        // 0 to 23 hours
        for ($i = 0; $i < 24; $i++) {
            $result[] = [
                'hour' => $i,
                'label' => ($i == 0 ? '12 AM' : ($i < 12 ? "$i AM" : ($i == 12 ? '12 PM' : ($i - 12).' PM'))),
                'value' => isset($keyedData[$i]) ? (int) $keyedData[$i]->count : 0,
            ];
        }

        return $result;
    }

    private function getCallerTypeBreakdown(ReportFilterDTO $filters): array
    {
        // New vs Returning callers based on phone_number in the period?
        // The current logic implements a "New to the Company" (Acquisition) definition:
        // First-Time Caller: Someone whose very first interaction with the system occurred within the selected date range.
        // Returning Caller: Someone who called during the selected range but had already called at least once before the selected range started.

        // Let's approximate: count distinct numbers that have calls BEFORE start date.
        // 1. Get unique numbers in current range.
        // 2. Count how many of them appear in logs BEFORE start date.

        // Get unique numbers in range
        $numbersInRange = $this->getBaseQuery($filters)->distinct()->pluck('phone_number_hash');

        if ($numbersInRange->isEmpty()) {
            return [
                ['name' => 'First-Time Callers', 'value' => 0, 'fill' => '#3b82f6'],
                ['name' => 'Returning Callers', 'value' => 0, 'fill' => '#a855f7'],
            ];
        }

        $returningCount = DB::table('call_logs')
            ->whereIn('phone_number_hash', $numbersInRange)
            ->where('timestamp', '<', $filters->startDate)
            ->distinct('phone_number_hash')
            ->count('phone_number_hash');

        $totalUnique = $numbersInRange->count();
        $firstTime = $totalUnique - $returningCount;

        return [
            ['name' => 'First-Time Callers', 'value' => $firstTime, 'fill' => '#3b82f6'], // Blue
            ['name' => 'Returning Callers', 'value' => $returningCount, 'fill' => '#a855f7'], // Purple
        ];
    }

    private function getCallDirectionDistribution(ReportFilterDTO $filters): array
    {
        $stats = $this->getBaseQuery($filters)
            ->selectRaw("
                SUM(CASE WHEN call_logs.direction IN ('INCOMING', 'MISSED') THEN 1 ELSE 0 END) as incoming,
                SUM(CASE WHEN call_logs.direction = 'OUTGOING' THEN 1 ELSE 0 END) as outgoing
            ")
            ->first();

        return [
            ['name' => 'Incoming', 'value' => (int) ($stats->incoming ?? 0), 'fill' => '#3b82f6'], // Blue
            ['name' => 'Outgoing', 'value' => (int) ($stats->outgoing ?? 0), 'fill' => '#22c55e'], // Green
        ];
    }
}
