<?php

namespace Tests\Feature\Admin;

use App\Domain\Devices\Models\Device;
use App\Domain\Devices\Models\DeviceToken;
use App\Domain\Users\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RevokeDeviceTokensTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'admin']);
        \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'super-admin']);
    }

    public function test_admin_can_revoke_device_tokens()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $device = Device::factory()->create();

        // Create 3 active tokens
        DeviceToken::factory()->count(3)->create([
            'device_id' => $device->id,
            'revoked_at' => null,
            'expires_at' => now()->addDay(),
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/admin/devices/{$device->id}/revoke-tokens");

        $response->assertOk()
            ->assertJson([
                'revoked_count' => 3,
            ]);

        $this->assertEquals(0, DeviceToken::active()->where('device_id', $device->id)->count());
        $this->assertEquals(3, DeviceToken::revoked()->where('device_id', $device->id)->count());

        // Verify status in index
        $indexResponse = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/devices');

        $indexResponse->assertOk();
        $deviceData = collect($indexResponse->json('data'))->firstWhere('id', $device->id);

        $this->assertEquals($device->status, $deviceData['status']);
    }
}
