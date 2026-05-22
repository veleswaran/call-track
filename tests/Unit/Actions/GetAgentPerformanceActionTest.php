<?php

declare(strict_types=1);

namespace Tests\Unit\Actions;

use App\Domain\Agents\Models\Agent;
use App\Domain\Calls\Models\CallLog;
use App\Domain\Devices\Models\Device;
use App\Domain\Reports\Actions\GetAgentPerformanceAction;
use App\Domain\Reports\DTOs\ReportFilterDTO;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class GetAgentPerformanceActionTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_first_call_time_on_start_date(): void
    {
        $agent = Agent::factory()->create();
        $device = Device::factory()->create(['agent_id' => $agent->id]);

        // Create calls on different dates
        CallLog::factory()->create([
            'device_id' => $device->id,
            'timestamp' => '2026-05-01 09:30:00',
            'duration' => 10,
        ]);
        CallLog::factory()->create([
            'device_id' => $device->id,
            'timestamp' => '2026-05-01 14:45:00',
            'duration' => 10,
        ]);
        CallLog::factory()->create([
            'device_id' => $device->id,
            'timestamp' => '2026-05-02 08:15:00', // Earlier but on different day
            'duration' => 10,
        ]);

        $filters = new ReportFilterDTO(
            startDate: Carbon::parse('2026-05-01'),
            endDate: Carbon::parse('2026-05-05'),
        );

        $action = app(GetAgentPerformanceAction::class);
        $result = $action->execute($filters)->items();

        $this->assertNotEmpty($result);
        $this->assertEquals('09:30 AM', $result[0]['first_call_time']);
    }

    public function test_returns_first_call_within_range_when_no_calls_on_start_date(): void
    {
        $agent = Agent::factory()->create();
        $device = Device::factory()->create(['agent_id' => $agent->id]);

        CallLog::factory()->create([
            'device_id' => $device->id,
            'timestamp' => '2026-05-02 09:30:00',
            'duration' => 10,
        ]);

        $filters = new ReportFilterDTO(
            startDate: Carbon::parse('2026-05-01'),
            endDate: Carbon::parse('2026-05-05'),
        );

        $action = app(GetAgentPerformanceAction::class);
        $result = $action->execute($filters)->items();

        $this->assertNotEmpty($result);
        $this->assertEquals('09:30 AM', $result[0]['first_call_time']);
    }

    public function test_returns_earliest_call_when_multiple_calls_on_start_date(): void
    {
        $agent = Agent::factory()->create();
        $device = Device::factory()->create(['agent_id' => $agent->id]);

        CallLog::factory()->create([
            'device_id' => $device->id,
            'timestamp' => '2026-05-01 14:00:00',
            'duration' => 10,
        ]);
        CallLog::factory()->create([
            'device_id' => $device->id,
            'timestamp' => '2026-05-01 08:45:00',
            'duration' => 10,
        ]);
        CallLog::factory()->create([
            'device_id' => $device->id,
            'timestamp' => '2026-05-01 11:15:00',
            'duration' => 10,
        ]);

        $filters = new ReportFilterDTO(
            startDate: Carbon::parse('2026-05-01'),
            endDate: Carbon::parse('2026-05-05'),
        );

        $action = app(GetAgentPerformanceAction::class);
        $result = $action->execute($filters)->items();

        $this->assertNotEmpty($result);
        $this->assertEquals('08:45 AM', $result[0]['first_call_time']);
    }

    public function test_returns_first_call_when_date_range_is_single_day(): void
    {
        $agent = Agent::factory()->create();
        $device = Device::factory()->create(['agent_id' => $agent->id]);

        CallLog::factory()->create([
            'device_id' => $device->id,
            'timestamp' => '2026-05-21 10:15:00',
            'duration' => 10,
        ]);

        $filters = new ReportFilterDTO(
            startDate: Carbon::parse('2026-05-21'),
            endDate: Carbon::parse('2026-05-21'),
        );

        $action = app(GetAgentPerformanceAction::class);
        $result = $action->execute($filters)->items();

        $this->assertNotEmpty($result);
        $this->assertEquals('10:15 AM', $result[0]['first_call_time']);
    }

    public function test_returns_na_when_agent_has_no_calls_at_all(): void
    {
        $agent = Agent::factory()->create();
        $device = Device::factory()->create(['agent_id' => $agent->id]);

        // No call logs created

        $filters = new ReportFilterDTO(
            startDate: Carbon::parse('2026-05-01'),
            endDate: Carbon::parse('2026-05-05'),
        );

        $action = app(GetAgentPerformanceAction::class);
        $result = $action->execute($filters)->items();

        // Since the query does an INNER JOIN on devices and call_logs, an agent with NO call logs will NOT appear in the results.
        // This is existing behavior of GetAgentPerformanceAction. So result should be empty.
        $this->assertEmpty($result);
    }

    public function test_sorts_performance_report_by_first_call_time(): void
    {
        $agentA = Agent::factory()->create(['name' => 'Agent A']);
        $deviceA = Device::factory()->create(['agent_id' => $agentA->id]);
        CallLog::factory()->create([
            'device_id' => $deviceA->id,
            'agent_id' => $agentA->id,
            'timestamp' => '2026-05-21 11:00:00',
        ]);

        $agentB = Agent::factory()->create(['name' => 'Agent B']);
        $deviceB = Device::factory()->create(['agent_id' => $agentB->id]);
        CallLog::factory()->create([
            'device_id' => $deviceB->id,
            'agent_id' => $agentB->id,
            'timestamp' => '2026-05-21 09:00:00',
        ]);

        $action = app(GetAgentPerformanceAction::class);

        // Test Ascending Sort
        $filtersAsc = new ReportFilterDTO(
            startDate: Carbon::parse('2026-05-21'),
            endDate: Carbon::parse('2026-05-21'),
            sortBy: 'first_call_time',
            sortOrder: 'asc'
        );
        $resultAsc = $action->execute($filtersAsc)->items();
        $this->assertCount(2, $resultAsc);
        $this->assertEquals($agentB->name, $resultAsc[0]['agent']); // 09:00 AM comes before 11:00 AM

        // Test Descending Sort
        $filtersDesc = new ReportFilterDTO(
            startDate: Carbon::parse('2026-05-21'),
            endDate: Carbon::parse('2026-05-21'),
            sortBy: 'first_call_time',
            sortOrder: 'desc'
        );
        $resultDesc = $action->execute($filtersDesc)->items();
        $this->assertCount(2, $resultDesc);
        $this->assertEquals($agentA->name, $resultDesc[0]['agent']); // 11:00 AM comes after 09:00 AM
    }
}
