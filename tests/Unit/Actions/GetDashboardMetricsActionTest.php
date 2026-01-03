<?php

declare(strict_types=1);

namespace Tests\Unit\Actions;

use App\Domain\Calls\Models\CallLog;
use App\Domain\Dashboard\Actions\GetDashboardMetricsAction;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class GetDashboardMetricsActionTest extends TestCase
{
    use RefreshDatabase;

    private GetDashboardMetricsAction $action;

    protected function setUp(): void
    {
        parent::setUp();
        $this->action = new GetDashboardMetricsAction;
    }

    #[Test]
    public function it_returns_current_week_metrics(): void
    {
        // Create calls this week (using IST timezone to match action)
        CallLog::factory()->count(5)->create([
            'timestamp' => Carbon::now('Asia/Kolkata')->startOfWeek()->addDay(),
            'duration' => 120,
        ]);

        // Create calls last week (should not be counted in current metrics)
        CallLog::factory()->count(3)->create([
            'timestamp' => Carbon::now('Asia/Kolkata')->subWeek()->startOfWeek()->addDay(),
            'duration' => 60,
        ]);

        $metrics = $this->action->execute();

        $this->assertEquals(5, $metrics->total_calls);
        $this->assertEquals(600, $metrics->total_duration_seconds); // 5 * 120
    }

    #[Test]
    public function it_calculates_positive_change_percent(): void
    {
        // Previous week: 4 calls
        CallLog::factory()->count(4)->create([
            'timestamp' => Carbon::now('Asia/Kolkata')->subWeek()->startOfWeek()->addDay(),
            'duration' => 100,
        ]);

        // Current week: 5 calls (25% increase)
        CallLog::factory()->count(5)->create([
            'timestamp' => Carbon::now('Asia/Kolkata')->startOfWeek()->addDay(),
            'duration' => 100,
        ]);

        $metrics = $this->action->execute();

        $this->assertEquals(5, $metrics->total_calls);
        $this->assertEquals(25.0, $metrics->total_calls_change_percent);
    }

    #[Test]
    public function it_calculates_negative_change_percent(): void
    {
        // Previous week: 10 calls
        CallLog::factory()->count(10)->create([
            'timestamp' => Carbon::now('Asia/Kolkata')->subWeek()->startOfWeek()->addDay(),
            'duration' => 100,
        ]);

        // Current week: 8 calls (20% decrease)
        CallLog::factory()->count(8)->create([
            'timestamp' => Carbon::now('Asia/Kolkata')->startOfWeek()->addDay(),
            'duration' => 100,
        ]);

        $metrics = $this->action->execute();

        $this->assertEquals(8, $metrics->total_calls);
        $this->assertEquals(-20.0, $metrics->total_calls_change_percent);
    }

    #[Test]
    public function it_handles_zero_previous_week_gracefully(): void
    {
        // No calls last week, 5 calls this week
        CallLog::factory()->count(5)->create([
            'timestamp' => Carbon::now('Asia/Kolkata')->startOfWeek()->addDay(),
            'duration' => 100,
        ]);

        $metrics = $this->action->execute();

        $this->assertEquals(5, $metrics->total_calls);
        // When previous is 0 and current > 0, return 100%
        $this->assertEquals(100.0, $metrics->total_calls_change_percent);
    }

    #[Test]
    public function it_returns_null_when_no_data(): void
    {
        // No calls at all
        $metrics = $this->action->execute();

        $this->assertEquals(0, $metrics->total_calls);
        $this->assertNull($metrics->total_calls_change_percent);
    }
}
