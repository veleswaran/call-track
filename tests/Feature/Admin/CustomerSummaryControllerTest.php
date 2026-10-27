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

class CustomerSummaryControllerTest extends TestCase
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
            'name' => 'ANNAL',
            'employee_code' => 'AXNPL-178',
        ]);
        $this->device = Device::factory()->create(['agent_id' => $this->agent->id]);

        $this->team = Team::create(['name' => 'Sales']);
        $this->team->members()->attach($this->agent->id, ['role' => 'MEMBER']);
    }

    public function test_customer_summary_metrics_endpoint_returns_kpis(): void
    {
        $today = Carbon::now();

        CallLog::factory()->create([
            'device_id' => $this->device->id,
            'agent_id' => $this->agent->id,
            'timestamp' => $today,
            'duration' => 300,
            'direction' => 'OUTGOING',
        ]);

        $url = '/api/v1/admin/customer-summary/metrics?start_date='.$today->copy()->subDay()->toDateString().'&end_date='.$today->copy()->addDay()->toDateString();
        $response = $this->actingAs($this->admin)->getJson($url);

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'total_accounts',
                    'total_calls',
                    'connected_calls',
                    'connected_pct',
                    'total_talk_time',
                    'total_talk_time_raw',
                    'missed_calls',
                    'pending_missed_calls',
                    'sla_pending_count',
                    'unattended_count',
                    'auto_resolved_count',
                ],
            ]);
    }

    public function test_customer_summary_index_returns_paginated_records(): void
    {
        $today = Carbon::now();
        $phoneHash = hash('sha256', '+919842178920');

        Contact::create([
            'name' => 'Karthik Builders & Infrastructure',
            'phone_hash' => $phoneHash,
            'phone_number' => '+919842178920',
            'is_internal' => false,
        ]);

        CallLog::factory()->create([
            'device_id' => $this->device->id,
            'agent_id' => $this->agent->id,
            'phone_number_hash' => $phoneHash,
            'phone_number' => '+919842178920',
            'timestamp' => $today,
            'duration' => 240,
            'direction' => 'OUTGOING',
        ]);

        $url = '/api/v1/admin/customer-summary?start_date='.$today->copy()->subDay()->toDateString().'&end_date='.$today->copy()->addDay()->toDateString();
        $response = $this->actingAs($this->admin)->getJson($url);

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'phone_hash',
                        'customer_name',
                        'organization',
                        'phone_number',
                        'total_calls',
                        'missed_calls',
                        'total_duration',
                        'total_duration_raw',
                        'avg_duration',
                        'avg_duration_raw',
                        'last_call',
                        'primary_agent',
                    ],
                ],
            ]);
    }

    public function test_customer_summary_index_supports_sorting(): void
    {
        $today = Carbon::now();
        $hash1 = hash('sha256', '+919842100001');
        $hash2 = hash('sha256', '+919842100002');

        Contact::create([
            'name' => 'Alpha Customer',
            'phone_hash' => $hash1,
            'phone_number' => '+919842100001',
            'is_internal' => false,
        ]);

        Contact::create([
            'name' => 'Beta Customer',
            'phone_hash' => $hash2,
            'phone_number' => '+919842100002',
            'is_internal' => false,
        ]);

        // Contact 1: 1 call, 0 missed, 100 duration
        CallLog::factory()->create([
            'device_id' => $this->device->id,
            'agent_id' => $this->agent->id,
            'phone_number_hash' => $hash1,
            'phone_number' => '+919842100001',
            'timestamp' => $today->copy()->subMinutes(10),
            'duration' => 100,
            'direction' => 'OUTGOING',
        ]);

        // Contact 2: 2 calls, 1 missed, 600 duration
        CallLog::factory()->create([
            'device_id' => $this->device->id,
            'agent_id' => $this->agent->id,
            'phone_number_hash' => $hash2,
            'phone_number' => '+919842100002',
            'timestamp' => $today->copy()->subMinutes(5),
            'duration' => 600,
            'direction' => 'INCOMING',
        ]);
        CallLog::factory()->create([
            'device_id' => $this->device->id,
            'agent_id' => $this->agent->id,
            'phone_number_hash' => $hash2,
            'phone_number' => '+919842100002',
            'timestamp' => $today->copy()->subMinutes(3),
            'duration' => 0,
            'direction' => 'MISSED',
        ]);

        $base = '/api/v1/admin/customer-summary?start_date='.$today->copy()->subDay()->toDateString().'&end_date='.$today->copy()->addDay()->toDateString();

        // Sort by total_calls desc -> Beta (2) should be first
        $resCallsDesc = $this->actingAs($this->admin)->getJson($base.'&sort_by=total_calls&sort_order=desc');
        $resCallsDesc->assertOk();
        $this->assertSame('Beta Customer', $resCallsDesc->json('data.0.customer_name'));

        // Sort by total_calls asc -> Alpha (1) should be first
        $resCallsAsc = $this->actingAs($this->admin)->getJson($base.'&sort_by=total_calls&sort_order=asc');
        $resCallsAsc->assertOk();
        $this->assertSame('Alpha Customer', $resCallsAsc->json('data.0.customer_name'));

        // Sort by missed_calls desc -> Beta (1) should be first
        $resMissedDesc = $this->actingAs($this->admin)->getJson($base.'&sort_by=missed_calls&sort_order=desc');
        $resMissedDesc->assertOk();
        $this->assertSame('Beta Customer', $resMissedDesc->json('data.0.customer_name'));

        // Sort by total_duration desc -> Beta (600s) should be first
        $resDurDesc = $this->actingAs($this->admin)->getJson($base.'&sort_by=total_duration&sort_order=desc');
        $resDurDesc->assertOk();
        $this->assertSame('Beta Customer', $resDurDesc->json('data.0.customer_name'));

        // Sort by total_duration asc -> Alpha (100s) should be first
        $resDurAsc = $this->actingAs($this->admin)->getJson($base.'&sort_by=total_duration&sort_order=asc');
        $resDurAsc->assertOk();
        $this->assertSame('Alpha Customer', $resDurAsc->json('data.0.customer_name'));
    }
}
