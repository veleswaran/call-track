<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Admin;

use App\Domain\Devices\Models\Device;
use App\Domain\Users\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeviceSearchTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');
    }

    public function test_can_search_devices_by_app_version(): void
    {
        Device::factory()->create([
            'name' => 'Device A',
            'app_version' => '1.0.0',
        ]);
        Device::factory()->create([
            'name' => 'Device B',
            'app_version' => '2.0.0',
        ]);
        Device::factory()->create([
            'name' => 'Device C',
            'app_version' => '1.1.0',
        ]);

        // Search for '2.0'
        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/devices?search=2.0');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.device_name', 'Device B');
        $response->assertJsonPath('data.0.app_version', '2.0.0');

        // Search for '1.'
        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/devices?search=1.');
        $response->assertOk();
        $response->assertJsonCount(2, 'data');
        $names = collect($response->json('data'))->pluck('device_name')->toArray();
        $this->assertContains('Device A', $names);
        $this->assertContains('Device C', $names);

        // Search for '1.2'
        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/devices?search=1.2');
        $response->assertOk();
    }
}
