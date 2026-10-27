<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Domain\Agents\Models\Agent;
use App\Domain\Calls\Models\CallLog;
use App\Domain\Calls\Models\Contact;
use App\Domain\Devices\Models\Device;
use App\Domain\Teams\Models\Team;
use App\Domain\Users\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CallInsightsControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private Device $device;

    private Agent $agent;

    private Team $team;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');

        $this->agent = Agent::factory()->create([
            'name' => 'Abirami Sureshsharma',
            'employee_code' => 'AXNPL-192',
        ]);
        $this->device = Device::factory()->create(['agent_id' => $this->agent->id]);

        $this->team = Team::create(['name' => 'Service Team']);
        $this->team->members()->attach($this->agent->id, ['role' => 'MEMBER']);

    }

    public function test_top_callers_endpoint_returns_leaderboard_data(): void
    {
        $today = Carbon::now();
        CallLog::factory()->create([
            'device_id' => $this->device->id,
            'timestamp' => $today,
            'duration' => 120,
            'direction' => 'INCOMING',
        ]);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/call-insights/top-callers?start_date='.$today->copy()->subDay()->toDateString().'&end_date='.$today->copy()->addDay()->toDateString());

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'rank',
                        'id',
                        'agent',
                        'employee_code',
                        'team',
                        'total_calls',
                        'connected',
                        'missed',
                        'handling_rate',
                        'total_duration',
                    ],
                ],
            ]);

        $this->assertEquals('Abirami Sureshsharma', $response->json('data.0.agent'));
        $this->assertEquals('Service Team', $response->json('data.0.team'));
        $this->assertEquals(1, $response->json('data.0.total_calls'));
    }

    public function test_agent_insights_endpoint_returns_kpis_and_distribution(): void
    {
        $today = Carbon::now();
        CallLog::factory()->create([
            'device_id' => $this->device->id,
            'timestamp' => $today,
            'duration' => 180,
            'direction' => 'OUTGOING',
            'sim_slot' => 1,
        ]);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/call-insights/agent-insights?agent_ids[]='.$this->agent->id.'&start_date='.$today->copy()->subDays(2)->toDateString().'&end_date='.$today->copy()->addDay()->toDateString());

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'agent' => ['id', 'name', 'employee_code', 'team', 'device_hardware_id'],
                    'kpis' => ['calls_in_period', 'connected_calls', 'missed_calls', 'total_talk_time'],
                    'daily_distribution',
                    'outreach_characteristics' => ['direction', 'sim_allocation', 'classification', 'device_hardware_id'],
                ],
            ]);

        $this->assertEquals('Abirami Sureshsharma', $response->json('data.agent.name'));
        $this->assertEquals(1, $response->json('data.kpis.calls_in_period'));
    }

    public function test_frequently_contacted_endpoint_returns_touchpoints(): void
    {
        $today = Carbon::now();
        $hash = hash('sha256', '+919443211984');

        Contact::create([
            'name' => 'Shri Ram Textiles & Garments',
            'phone_hash' => $hash,
            'phone_number' => '+919443211984',
        ]);

        CallLog::factory()->create([
            'device_id' => $this->device->id,
            'phone_number_hash' => $hash,
            'phone_number' => '+919443211984',
            'timestamp' => $today,
            'duration' => 240,
            'direction' => 'INCOMING',
        ]);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/call-insights/frequently-contacted?start_date='.$today->copy()->subDay()->toDateString().'&end_date='.$today->copy()->addDay()->toDateString());

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'customer_name',
                        'phone_number',
                        'account_category',
                        'total_touchpoints',
                        'in_out_ratio',
                        'total_talk_time',
                        'agents_handled',
                    ],
                ],
            ]);

        $this->assertEquals('Shri Ram Textiles & Garments', $response->json('data.0.customer_name'));
        $this->assertEquals(1, $response->json('data.0.total_touchpoints'));
    }

    public function test_longest_calls_endpoint_returns_duration_audit(): void
    {
        $today = Carbon::now();
        CallLog::factory()->create([
            'device_id' => $this->device->id,
            'timestamp' => $today,
            'duration' => 950,
            'direction' => 'OUTGOING',
        ]);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/call-insights/longest-calls?start_date='.$today->copy()->subDay()->toDateString().'&end_date='.$today->copy()->addDay()->toDateString());

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'customer_name',
                        'agent',
                        'team',
                        'duration',
                        'direction',
                    ],
                ],
            ]);

        $this->assertEquals(950, $response->json('data.0.duration_raw'));
    }
}
