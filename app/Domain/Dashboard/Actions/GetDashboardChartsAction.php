<?php

declare(strict_types=1);

namespace App\Domain\Dashboard\Actions;

use App\Domain\Dashboard\DTOs\DashboardChartsDTO;
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
     * @param int[]|null $allowedAgentIds Null = full access, array = restricted agent IDs
     */
    public function execute(?array $allowedAgentIds = null): DashboardChartsDTO
    {
        $tz = 'Asia/Kolkata';

        return DashboardChartsDTO::from(
            volumeTrends: $this->getVolumeTrends($tz, $allowedAgentIds),
            outcomeDistribution: $this->getOutcomeDistribution($tz, $allowedAgentIds),
        );
    }

    /**
     * Get call volume trends grouped by day for current and previous week
     * @return array<int, array{day: string, current: int, previous: int}>
     */
    private function getVolumeTrends(string $tz, ?array $allowedAgentIds): array
    {
        $currentWeekStart = Carbon::now($tz)->startOfWeek();
        $previousWeekStart = Carbon::now($tz)->subWeek()->startOfWeek();

        // Get current week data grouped by day of week
        $currentWeek = $this->getWeeklyData($currentWeekStart, $allowedAgentIds);
        $previousWeek = $this->getWeeklyData($previousWeekStart, $allowedAgentIds);

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
    private function getOutcomeDistribution(string $tz, ?array $allowedAgentIds): array
    {
        $weekStart = Carbon::now($tz)->startOfWeek();
        $weekEnd = Carbon::now($tz)->endOfWeek();

        $query = DB::table('call_logs')
            ->join('devices', 'call_logs.device_id', '=', 'devices.id')
            ->whereBetween('call_logs.timestamp', [$weekStart, $weekEnd]);

        if ($allowedAgentIds !== null) {
            $query->whereIn('devices.agent_id', $allowedAgentIds);
        }

        $results = $query
            ->select([
                DB::raw("CASE
                    WHEN call_logs.direction = 'MISSED' THEN 'Missed'
                    WHEN call_logs.direction = 'OUTGOING' AND call_logs.duration = 0 THEN 'No Answer'
                    ELSE 'Connected'
                END as outcome"),
                DB::raw('COUNT(*) as count'),
            ])
            ->groupBy(DB::raw("CASE
                    WHEN call_logs.direction = 'MISSED' THEN 'Missed'
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
            if (!in_array($category, $existingNames)) {
                $distribution[] = ['name' => $category, 'value' => 0];
            }
        }

        return $distribution;
    }
}
