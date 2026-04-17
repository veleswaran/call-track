<?php

declare(strict_types=1);

namespace App\Domain\Dashboard\Actions;

use App\Domain\Dashboard\DTOs\DashboardChartsDTO;
use App\Domain\Dashboard\DTOs\DashboardFilterDTO;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Action to compute dashboard chart data
 */
final class GetDashboardChartsAction
{
    private const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    /**
     * Execute the action to get chart data
     */
    public function execute(DashboardFilterDTO $filter): DashboardChartsDTO
    {
        $tz = 'Asia/Kolkata';

        return DashboardChartsDTO::from(
            volumeTrends: $this->getVolumeTrends($tz, $filter),
            outcomeDistribution: $this->getOutcomeDistribution($tz, $filter),
        );
    }

    /**
     * Get call volume trends grouped by day for current and previous week
     *
     * @return array<int, array{day: string, current: int, previous: int}>
     */
    private function getVolumeTrends(string $tz, DashboardFilterDTO $filter): array
    {
        if ($filter->startDate && $filter->endDate) {
            $currentStart = $filter->startDate->copy()->startOfWeek(); // We align to week for DOW grouping
            $previousStart = $currentStart->copy()->subWeek();
        } else {
            $currentStart = Carbon::now($tz)->startOfWeek();
            $previousStart = Carbon::now($tz)->subWeek()->startOfWeek();
        }

        // Get current week data grouped by day of week
        $currentWeek = $this->getWeeklyData($currentStart, $filter->allowedAgentIds);
        $previousWeek = $this->getWeeklyData($previousStart, $filter->allowedAgentIds);

        $trends = [];
        foreach (self::DAYS as $index => $day) {
            $dayNumber = $index + 1; // 1=Monday, 6=Saturday
            $trends[] = [
                'day' => $day,
                'current' => $currentWeek[$dayNumber] ?? 0,
                'previous' => $previousWeek[$dayNumber] ?? 0,
            ];
        }

        return $trends;
    }

    /**
     * Get daily call counts for a week
     *
     * @return array<int, int>
     */
    private function getWeeklyData(Carbon $weekStart, ?array $allowedAgentIds): array
    {
        $weekEnd = $weekStart->copy()->endOfWeek();

        $query = DB::table('call_logs')
            ->join('devices', 'call_logs.device_id', '=', 'devices.id')
            ->whereBetween('call_logs.timestamp', [$weekStart, $weekEnd]);

        if ($allowedAgentIds !== null) {
            $query->whereIn('devices.agent_id', $allowedAgentIds);
        }

        $results = $query
            ->select([
                DB::raw('EXTRACT(DOW FROM call_logs.timestamp) as day_of_week'),
                DB::raw('COUNT(*) as count'),
            ])
            ->groupBy(DB::raw('EXTRACT(DOW FROM call_logs.timestamp)'))
            ->get();

        $data = [];
        foreach ($results as $row) {
            // PostgreSQL DOW: 0=Sunday, 1=Monday, ... Convert to 1=Monday
            $dow = (int) $row->day_of_week;
            $normalizedDay = $dow === 0 ? 7 : $dow; // Sunday becomes 7
            $data[$normalizedDay] = (int) $row->count;
        }

        return $data;
    }

    /**
     * Get call outcome distribution for current week
     *
     * @return array<int, array{name: string, value: int}>
     */
    private function getOutcomeDistribution(string $tz, DashboardFilterDTO $filter): array
    {
        if ($filter->startDate && $filter->endDate) {
            $periodStart = $filter->startDate->copy()->startOfDay();
            $periodEnd = $filter->endDate->copy()->endOfDay();
        } else {
            $periodStart = Carbon::now($tz)->startOfWeek(Carbon::SUNDAY);
            $periodEnd = $periodStart->copy()->addDays(6)->endOfDay();
        }

        $query = DB::table('call_logs')
            ->join('devices', 'call_logs.device_id', '=', 'devices.id')
            ->whereBetween('call_logs.timestamp', [$periodStart, $periodEnd]);

        if ($filter->allowedAgentIds !== null) {
            $query->whereIn('devices.agent_id', $filter->allowedAgentIds);
        }

        $results = $query
            ->select([
                DB::raw("CASE
                    WHEN call_logs.direction IN ('MISSED', 'REJECTED', 'BLOCKED') OR (call_logs.direction = 'INCOMING' AND call_logs.duration <= 0) THEN 'Missed'
                    WHEN call_logs.direction = 'OUTGOING' AND call_logs.duration = 0 THEN 'No Answer'
                    ELSE 'Connected'
                END as outcome"),
                DB::raw('COUNT(*) as count'),
            ])
            ->groupBy(DB::raw("CASE
                    WHEN call_logs.direction IN ('MISSED', 'REJECTED', 'BLOCKED') OR (call_logs.direction = 'INCOMING' AND call_logs.duration <= 0) THEN 'Missed'
                    WHEN call_logs.direction = 'OUTGOING' AND call_logs.duration = 0 THEN 'No Answer'
                    ELSE 'Connected'
                END"))
            ->get();

        $distribution = [];
        foreach ($results as $row) {
            $distribution[] = [
                'name' => $row->outcome,
                'value' => (int) $row->count,
            ];
        }

        // Ensure all categories exist even if count is 0
        $categories = ['Connected', 'Missed', 'No Answer'];
        $existingNames = array_column($distribution, 'name');

        foreach ($categories as $category) {
            if (! in_array($category, $existingNames)) {
                $distribution[] = ['name' => $category, 'value' => 0];
            }
        }

        return $distribution;
    }
}
