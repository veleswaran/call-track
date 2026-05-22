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
}
