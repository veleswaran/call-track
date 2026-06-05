<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Reports\Actions;

use App\Domain\Reports\Actions\GetDayWiseReportAction;
use Carbon\Carbon;
use PHPUnit\Framework\Attributes\DataProvider;
use ReflectionMethod;
use Tests\TestCase;

final class GetDayWiseReportActionTest extends TestCase
{
    #[DataProvider('calendarDayDifferenceProvider')]
    public function test_diff_in_calendar_days_is_dst_safe(string $startDate, string $endDate, int $expectedDays): void
    {
        $previousTimezone = date_default_timezone_get();
        date_default_timezone_set('America/New_York');

        try {
            $action = app(GetDayWiseReportAction::class);
            $method = new ReflectionMethod(GetDayWiseReportAction::class, 'diffInCalendarDays');
            $method->setAccessible(true);

            $actualDays = $method->invoke(
                $action,
                Carbon::parse($startDate),
                Carbon::parse($endDate),
            );

            $this->assertSame($expectedDays, $actualDays);
        } finally {
            date_default_timezone_set($previousTimezone);
        }
    }

    /**
     * @return array<string, array{0: string, 1: string, 2: int}>
     */
    public static function calendarDayDifferenceProvider(): array
    {
        return [
            'same day' => ['2024-03-10', '2024-03-10', 0],
            'spans us spring dst transition' => ['2024-03-09', '2024-03-11', 2],
            'sixty inclusive calendar days' => ['2024-03-01', '2024-04-29', 59],
            'sixty one inclusive calendar days' => ['2024-03-01', '2024-04-30', 60],
        ];
    }
}
