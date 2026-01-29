<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Admin;

use App\Domain\Agents\Models\Agent;
use App\Domain\Devices\Models\Device;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_search_devices()
    {
        $admin = \App\Domain\Users\Models\User::factory()->create();
        $role = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $admin->assignRole($role);
        $device1 = Device::factory()->create(['name' => 'Pixel 7']);
        $device2 = Device::factory()->create(['name' => 'iPhone 15']);

        $response = $this->actingAs($admin)->getJson('/api/v1/admin/devices?search=Pixel');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $device1->id);

        $responseEmpty = $this->actingAs($admin)->getJson('/api/v1/admin/devices?search=Samsung');
        $responseEmpty->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_can_search_agents()
    {
        $admin = \App\Domain\Users\Models\User::factory()->create();
        $role = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $admin->assignRole($role);
        $agent1 = Agent::factory()->create(['name' => 'John Doe', 'employee_code' => 'EMP001']);
        $agent2 = Agent::factory()->create(['name' => 'Jane Smith', 'employee_code' => 'EMP002']);

        $response = $this->actingAs($admin)->getJson('/api/v1/admin/agents?search=John');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $agent1->id);

        $responseCode = $this->actingAs($admin)->getJson('/api/v1/admin/agents?search=EMP002');
        $responseCode->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $agent2->id);
    }
}
