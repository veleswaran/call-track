<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Admin;

use App\Domain\Agents\Models\Agent;
use App\Domain\Devices\Models\Device;
use App\Domain\Users\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DashboardControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_requires_authentication(): void
    {
        $response = $this->getJson('/api/v1/admin/dashboard');

        $response->assertUnauthorized();
    }

    public function test_dashboard_returns_metrics(): void
    {
        $user = User::factory()->create();
        $role = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $user->assignRole($role);
        Sanctum::actingAs($user);

        // Create test data
        $agent = Agent::factory()->create();
        $device = Device::factory()->create(['agent_id' => $agent->id]);
        Device::factory()->create();

        // Create call logs directly
        $callLogIds = [];
        for ($i = 0; $i < 10; $i++) {
            $callLogIds[] = DB::table('call_logs')->insertGetId([
                'device_id' => $device->id,
                'call_hash' => 'hash_'.$i,
                'phone_number_hash' => 'phone_hash_'.$i,
                'direction' => 'INCOMING',
                'duration' => 60,
                'timestamp' => now(),
                'created_at' => now(),
            ]);
        }

        // Add classifications for some calls
        DB::table('call_classifications')->insert([
            ['call_log_id' => $callLogIds[0], 'user_id' => $user->id, 'type' => 'BUSINESS', 'created_at' => now(), 'updated_at' => now()],
            ['call_log_id' => $callLogIds[1], 'user_id' => $user->id, 'type' => 'BUSINESS', 'created_at' => now(), 'updated_at' => now()],
            ['call_log_id' => $callLogIds[2], 'user_id' => $user->id, 'type' => 'BUSINESS', 'created_at' => now(), 'updated_at' => now()],
            ['call_log_id' => $callLogIds[3], 'user_id' => $user->id, 'type' => 'PERSONAL', 'created_at' => now(), 'updated_at' => now()],
            ['call_log_id' => $callLogIds[4], 'user_id' => $user->id, 'type' => 'PERSONAL', 'created_at' => now(), 'updated_at' => now()],
        ]);

        $response = $this->getJson('/api/v1/admin/dashboard');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'total_calls',
                    'business_calls',
                    'personal_calls',
                    'ignored_calls',
                    'unclassified_calls',
                    'total_devices',
                    'active_devices',
                    'total_agents',
                    'total_duration_seconds',
                    'average_call_duration_seconds',
                ],
            ]);

        $data = $response->json('data');
        $this->assertEquals(10, $data['total_calls']);
        $this->assertEquals(8, $data['business_calls']); // 3 explicit + 5 implicit
        $this->assertEquals(2, $data['personal_calls']);
        $this->assertEquals(0, $data['unclassified_calls']);
        $this->assertEquals(2, $data['total_devices']);
        $this->assertEquals(1, $data['active_devices']); // 1 device has recent activity
        $this->assertEquals(1, $data['total_agents']);
    }

    public function test_dashboard_returns_zero_metrics_when_empty(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/admin/dashboard');

        $response->assertOk();

        $data = $response->json('data');
        $this->assertEquals(0, $data['total_calls']);
        $this->assertEquals(0, $data['business_calls']);
        $this->assertEquals(0, $data['total_devices']);
        $this->assertEquals(0, $data['total_agents']);
    }
}
