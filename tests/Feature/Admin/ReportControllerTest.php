<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Domain\Calls\Models\CallLog;
use App\Domain\Devices\Models\Device;
use App\Domain\Users\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private Device $device;

    private \App\Domain\Agents\Models\Agent $agent;

    protected function setUp(): void
    {
        parent::setUp();

        // Create role if not exists
        \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');

        // Create Agent and linked Device
        $this->agent = \App\Domain\Agents\Models\Agent::factory()->create();
        $this->device = Device::factory()->create(['agent_id' => $this->agent->id]);
    }

    public function test_metrics_endpoint_returns_correct_data_with_filters(): void
    {
        // 1. Create calls in range
        $today = Carbon::now();
        CallLog::factory()->create([
            'device_id' => $this->device->id,
            'timestamp' => $today,
            'duration' => 60,
            'direction' => 'INCOMING',
        ]);

        // 2. Create calls out of range
        CallLog::factory()->create([
            'device_id' => $this->device->id,
            'timestamp' => $today->copy()->subDays(10),
            'duration' => 60,
        ]);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/reports/metrics?start_date='.$today->copy()->subDay()->toDateString().'&end_date='.$today->copy()->addDay()->toDateString());

        $response->assertOk()
            ->assertJsonPath('data.0.label', 'Total Agents')
            ->assertJsonPath('data.1.value', '1') // Total calls
            ->assertJsonPath('data.2.value', '1') // Connected
            ->assertJsonPath('data.2.percentage', 100);
    }

    public function test_charts_endpoint_returns_structure(): void
    {
        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/reports/charts');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'calls_per_day',
                    'status_distribution',
                    'peak_call_hours',
                    'caller_types',
                ],
            ]);
    }

    public function test_performance_endpoint_returns_agent_data(): void
    {
        CallLog::factory()->create([
            'device_id' => $this->device->id,
            'duration' => 120,
        ]);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/reports/performance');

        $response->assertOk()
            ->assertJsonPath('data.0.agent', $this->agent->name)
            ->assertJsonPath('data.0.total_calls', 1)
            ->assertJsonPath('data.0.avg_duration', '2m 0s');
    }

    public function test_performance_endpoint_filters_by_contact_filter(): void
    {
        $contact = \App\Domain\Calls\Models\Contact::factory()->create([
            'is_internal' => true,
            'phone_number' => '+919999999999',
            'phone_hash' => hash('sha256', '+919999999999'),
        ]);
        // Clean cache so variations are populated
        app(\App\Actions\Contacts\GetContactHashVariationsAction::class)->clearCache();

        // 1. Internal call
        CallLog::factory()->create([
            'device_id' => $this->device->id,
            'phone_number_hash' => hash('sha256', '+919999999999'),
            'duration' => 120,
        ]);

        // 2. External call
        CallLog::factory()->create([
            'device_id' => $this->device->id,
            'phone_number_hash' => hash('sha256', '+918888888888'),
            'duration' => 60,
        ]);

        // Query internal
        $responseInternal = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/reports/performance?contact_filter=internal');

        $responseInternal->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.total_calls', 1)
            ->assertJsonPath('data.0.avg_duration', '2m 0s');

        // Query external
        $responseExternal = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/reports/performance?contact_filter=external');

        $responseExternal->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.total_calls', 1)
            ->assertJsonPath('data.0.avg_duration', '1m 0s');
    }

    public function test_day_wise_report_endpoint_returns_correct_day_wise_data(): void
    {
        $today = Carbon::today();
        CallLog::factory()->create([
            'device_id' => $this->device->id,
            'timestamp' => $today->copy()->hour(10)->minute(30),
            'duration' => 600, // 10 minutes
            'direction' => 'OUTGOING',
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/reports/day-wise?start_date='.$today->toDateString().'&end_date='.$today->toDateString());

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'agents' => [
                        '*' => [
                            'agent_id',
                            'agent_name',
                            'employee_code',
                            'daily_stats',
                            'period_total',
                        ],
                    ],
                    'dates',
                ],
            ]);

        $agentData = $response->json('data.agents.0');
        $this->assertEquals($this->agent->name, $agentData['agent_name']);
        $dateStr = $today->format('Y-m-d');
        $this->assertArrayHasKey($dateStr, $agentData['daily_stats']);

        $stats = $agentData['daily_stats'][$dateStr];
        $this->assertEquals(1, $stats['total_calls']);
        $this->assertEquals(1, $stats['connected']);
        $this->assertEquals(0, $stats['missed']);
        $this->assertEquals('10m', $stats['total_duration']);
        $this->assertEquals('10:30 AM', $stats['first_call_time']);
    }

    public function test_day_wise_report_endpoint_prevents_exceeding_32_days(): void
    {
        $startDate = Carbon::today()->subDays(40);
        $endDate = Carbon::today();

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/reports/day-wise?start_date='.$startDate->toDateString().'&end_date='.$endDate->toDateString());

        $response->assertStatus(500); // Throws InvalidArgumentException
    }

    public function test_day_wise_report_endpoint_filters_by_classification(): void
    {
        $today = Carbon::today();

        // 1. Call classified as BUSINESS (should be included when filtering for BUSINESS)
        $callLog1 = CallLog::factory()->create([
            'device_id' => $this->device->id,
            'timestamp' => $today->copy()->hour(10),
            'duration' => 300,
            'direction' => 'OUTGOING',
        ]);
        \App\Domain\Classification\Models\CallClassification::factory()->create([
            'call_log_id' => $callLog1->id,
            'user_id' => $this->admin->id,
            'type' => 'BUSINESS',
        ]);

        // 2. Call without classification (should be excluded when filtering for BUSINESS)
        CallLog::factory()->create([
            'device_id' => $this->device->id,
            'timestamp' => $today->copy()->hour(11),
            'duration' => 150,
            'direction' => 'OUTGOING',
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/reports/day-wise?start_date='.$today->toDateString().'&end_date='.$today->toDateString().'&types[]=BUSINESS');

        $response->assertOk();

        $agentData = $response->json('data.agents.0');
        $dateStr = $today->format('Y-m-d');
        $stats = $agentData['daily_stats'][$dateStr];

        // Assert only BUSINESS classification is included (total_calls should be 1, total_duration 300)
        $this->assertEquals(1, $stats['total_calls']);
        $this->assertEquals(300, $stats['total_duration_seconds']);
    }
}
