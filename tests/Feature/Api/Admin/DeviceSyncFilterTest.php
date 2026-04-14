<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Admin;

use App\Domain\Devices\Models\Device;
use App\Domain\Users\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeviceSyncFilterTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed roles
        $this->seed(RolePermissionSeeder::class);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');
    }

    public function test_can_filter_active_devices(): void
    {
        // Active: synced within 60 mins
        Device::factory()->create(['name' => 'Active Device', 'last_heartbeat_at' => now()->subMinutes(30)]);
        // Warning: synced 60-180 mins
        Device::factory()->create(['name' => 'Warning Device', 'last_heartbeat_at' => now()->subMinutes(120)]);
        // Stale: synced > 180 mins
        Device::factory()->create(['name' => 'Stale Device', 'last_heartbeat_at' => now()->subMinutes(240)]);
        // Stale: never synced
        Device::factory()->create(['name' => 'Never Synced', 'last_heartbeat_at' => null]);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/devices?sync_status=active');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.device_name', 'Active Device');
    }

    public function test_can_filter_warning_devices(): void
    {
        Device::factory()->create(['name' => 'Active Device', 'last_heartbeat_at' => now()->subMinutes(30)]);
        Device::factory()->create(['name' => 'Warning Device', 'last_heartbeat_at' => now()->subMinutes(120)]);
        Device::factory()->create(['name' => 'Stale Device', 'last_heartbeat_at' => now()->subMinutes(240)]);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/devices?sync_status=warning');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.device_name', 'Warning Device');
    }

    public function test_can_filter_stale_devices(): void
    {
        Device::factory()->create(['name' => 'Active Device', 'last_heartbeat_at' => now()->subMinutes(30)]);
        Device::factory()->create(['name' => 'Stale Device', 'last_heartbeat_at' => now()->subMinutes(240)]);
        Device::factory()->create(['name' => 'Never Synced', 'last_heartbeat_at' => null]);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/devices?sync_status=stale');

        $response->assertOk();
        $response->assertJsonCount(2, 'data');
        $names = collect($response->json('data'))->pluck('device_name')->toArray();
        $this->assertContains('Stale Device', $names);
        $this->assertContains('Never Synced', $names);
    }

    public function test_returns_all_devices_when_sync_status_is_all(): void
    {
        Device::factory()->create(['last_heartbeat_at' => now()->subMinutes(30)]);
        Device::factory()->create(['last_heartbeat_at' => now()->subMinutes(240)]);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/devices?sync_status=all');

        $response->assertOk();
        $response->assertJsonCount(2, 'data');
    }
}
