<?php

declare(strict_types=1);

namespace Tests\Feature\Api\V1;

use App\Domain\Agents\Models\Agent;
use App\Domain\Calls\Models\CallEscalation;
use App\Domain\Calls\Models\CallLog;
use App\Domain\Users\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MissedCallExportTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\RolePermissionSeeder::class);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');

        Sanctum::actingAs($this->admin);
    }

    public function test_export_requires_date_range(): void
    {
        $response = $this->get('/api/v1/admin/call-logs/escalations/export');

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['date_from', 'date_to']);
    }

    public function test_export_rejects_date_range_over_32_days(): void
    {
        $response = $this->get(
            '/api/v1/admin/call-logs/escalations/export?date_from=2026-01-01&date_to=2026-02-02'
        );

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['date_range']);
    }

    public function test_export_allows_date_range_within_32_days(): void
    {
        $response = $this->get(
            '/api/v1/admin/call-logs/escalations/export?date_from=2026-01-01&date_to=2026-02-01'
        );

        $response->assertOk();
    }

    public function test_export_streams_csv_with_matching_rows(): void
    {
        $startDate = Carbon::parse('2026-03-01');
        $endDate = Carbon::parse('2026-03-05');

        $agent = Agent::factory()->create(['name' => 'Test Agent']);

        $includedCall = CallLog::factory()->create([
            'agent_id' => $agent->id,
            'direction' => 'MISSED',
            'timestamp' => $startDate->copy()->addDay(),
        ]);

        CallEscalation::create([
            'call_log_id' => $includedCall->id,
            'status' => 'pending',
            'response_due_at' => $startDate->copy()->addDay()->addHour(),
        ]);

        $excludedCall = CallLog::factory()->create([
            'direction' => 'MISSED',
            'timestamp' => $startDate->copy()->subMonth(),
        ]);

        CallEscalation::create([
            'call_log_id' => $excludedCall->id,
            'status' => 'pending',
            'response_due_at' => $startDate->copy()->subMonth()->addHour(),
        ]);

        $response = $this->get(
            '/api/v1/admin/call-logs/escalations/export?date_from='.$startDate->toDateString()
            .'&date_to='.$endDate->toDateString()
        );

        $response->assertOk();
        $this->assertStringContainsString('text/csv', (string) $response->headers->get('content-type'));

        $content = $response->streamedContent();

        $this->assertStringContainsString('Agent', $content);
        $this->assertStringContainsString('Client Number', $content);
        $this->assertStringContainsString('Test Agent', $content);
        $this->assertStringContainsString((string) $includedCall->phone_number, $content);

        $lines = array_values(array_filter(explode("\n", trim($content))));
        $this->assertCount(2, $lines);
    }

    public function test_export_respects_status_filter(): void
    {
        $date = Carbon::parse('2026-03-10');

        $pendingCall = CallLog::factory()->create([
            'direction' => 'MISSED',
            'timestamp' => $date,
        ]);

        $resolvedCall = CallLog::factory()->create([
            'direction' => 'MISSED',
            'timestamp' => $date,
        ]);

        CallEscalation::create([
            'call_log_id' => $pendingCall->id,
            'status' => 'pending',
            'response_due_at' => $date->copy()->addHour(),
        ]);

        CallEscalation::create([
            'call_log_id' => $resolvedCall->id,
            'status' => 'resolved',
            'response_due_at' => $date->copy()->addHour(),
            'resolved_at' => $date->copy()->addHours(2),
        ]);

        $response = $this->get(
            '/api/v1/admin/call-logs/escalations/export?date_from='.$date->toDateString()
            .'&date_to='.$date->toDateString()
            .'&status[]=pending'
        );

        $response->assertOk();

        $lines = array_values(array_filter(explode("\n", trim($response->streamedContent()))));
        $this->assertCount(2, $lines);
        $this->assertStringContainsString('pending', $lines[1]);
        $this->assertStringNotContainsString('resolved', $lines[1]);
    }

    public function test_export_requires_view_escalations_permission(): void
    {
        $member = User::factory()->create();
        $member->assignRole('member');

        Sanctum::actingAs($member);

        $response = $this->get(
            '/api/v1/admin/call-logs/escalations/export?date_from=2026-03-01&date_to=2026-03-02'
        );

        $response->assertForbidden();
    }

    public function test_export_requires_authentication(): void
    {
        $this->app['auth']->forgetGuards();

        $response = $this->getJson(
            '/api/v1/admin/call-logs/escalations/export?date_from=2026-03-01&date_to=2026-03-02'
        );

        $response->assertUnauthorized();
    }
}
