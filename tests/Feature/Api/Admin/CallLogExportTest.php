<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Admin;

use App\Domain\Agents\Models\Agent;
use App\Domain\Calls\Models\CallLog;
use App\Domain\Devices\Models\Device;
use App\Domain\Teams\Models\Team;
use App\Domain\Users\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CallLogExportTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');

        Sanctum::actingAs($this->admin);
    }

    public function test_export_requires_date_range(): void
    {
        $response = $this->get('/api/v1/admin/call-logs/export');

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['start_date', 'end_date']);
    }

    public function test_export_rejects_date_range_over_31_days(): void
    {
        $response = $this->get(
            '/api/v1/admin/call-logs/export?start_date=2026-01-01&end_date=2026-02-01'
        );

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['date_range']);
    }

    public function test_export_streams_csv_with_matching_rows(): void
    {
        $startDate = Carbon::parse('2026-03-01');
        $endDate = Carbon::parse('2026-03-05');

        $included = CallLog::factory()->create([
            'direction' => 'INCOMING',
            'duration' => 120,
            'timestamp' => $startDate->copy()->addDay(),
        ]);

        CallLog::factory()->create([
            'timestamp' => $startDate->copy()->subMonth(),
        ]);

        $response = $this->get(
            '/api/v1/admin/call-logs/export?start_date='.$startDate->toDateString()
            .'&end_date='.$endDate->toDateString()
        );

        $response->assertOk();
        $this->assertStringContainsString('text/csv', (string) $response->headers->get('content-type'));

        $content = $response->streamedContent();

        $this->assertStringContainsString('Timestamp', $content);
        $this->assertStringContainsString('Phone Number', $content);
        $this->assertStringContainsString('incoming', $content);
        $this->assertStringContainsString((string) $included->phone_number, $content);

        $lines = array_values(array_filter(explode("\n", trim($content))));
        $this->assertCount(2, $lines);
    }

    public function test_export_respects_type_filter(): void
    {
        $date = Carbon::parse('2026-03-10');

        CallLog::factory()->create([
            'direction' => 'INCOMING',
            'timestamp' => $date,
        ]);

        CallLog::factory()->create([
            'direction' => 'OUTGOING',
            'timestamp' => $date,
        ]);

        $response = $this->get(
            '/api/v1/admin/call-logs/export?start_date='.$date->toDateString()
            .'&end_date='.$date->toDateString()
            .'&types[]=incoming'
        );

        $response->assertOk();

        $lines = array_values(array_filter(explode("\n", trim($response->streamedContent()))));
        $this->assertCount(2, $lines);
        $this->assertStringContainsString('incoming', $lines[1]);
        $this->assertStringNotContainsString('outgoing', $lines[1]);
    }

    public function test_export_respects_team_manager_access_scope(): void
    {
        $team = Team::factory()->create();
        $allowedAgent = Agent::factory()->create();
        $otherAgent = Agent::factory()->create();

        $team->members()->attach($allowedAgent->id, ['role' => 'MEMBER']);

        $manager = User::factory()->create();
        $managerAgent = Agent::factory()->create(['user_id' => $manager->id]);
        $team->members()->attach($managerAgent->id, ['role' => 'MANAGER']);

        Sanctum::actingAs($manager);

        $allowedDevice = Device::factory()->create(['agent_id' => $allowedAgent->id]);
        $otherDevice = Device::factory()->create(['agent_id' => $otherAgent->id]);

        $date = Carbon::parse('2026-04-01');

        $allowedLog = CallLog::factory()->create([
            'device_id' => $allowedDevice->id,
            'agent_id' => $allowedAgent->id,
            'phone_number' => '+15551110001',
            'timestamp' => $date,
        ]);

        CallLog::factory()->create([
            'device_id' => $otherDevice->id,
            'agent_id' => $otherAgent->id,
            'phone_number' => '+15552220002',
            'timestamp' => $date,
        ]);

        $response = $this->get(
            '/api/v1/admin/call-logs/export?start_date='.$date->toDateString()
            .'&end_date='.$date->toDateString()
        );

        $response->assertOk();

        $content = $response->streamedContent();
        $this->assertStringContainsString((string) $allowedLog->phone_number, $content);
        $this->assertStringNotContainsString('+15552220002', $content);
    }

    public function test_export_requires_authentication(): void
    {
        $this->app['auth']->forgetGuards();

        $response = $this->getJson(
            '/api/v1/admin/call-logs/export?start_date=2026-03-01&end_date=2026-03-02'
        );

        $response->assertUnauthorized();
    }
}
