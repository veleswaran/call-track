<?php

namespace Tests\Unit\Actions;

use App\Actions\Devices\RevokeActiveTokensAction;
use App\Domain\Devices\DTOs\RevokeTokensDTO;
use App\Domain\Devices\Models\Device;
use App\Domain\Devices\Models\DeviceToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RevokeActiveTokensActionTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_revokes_all_active_tokens_for_device()
    {
        $device = Device::factory()->create();
        
        // Active tokens
        DeviceToken::factory()->count(3)->create(['device_id' => $device->id]);
        
        // Already revoked token
        DeviceToken::factory()->revoked()->create(['device_id' => $device->id]);

        $action = app(RevokeActiveTokensAction::class);
        $count = $action->execute(new RevokeTokensDTO($device->id));

        $this->assertEquals(3, $count);
        $this->assertEquals(0, DeviceToken::where('device_id', $device->id)->active()->count());
        $this->assertEquals(4, DeviceToken::where('device_id', $device->id)->revoked()->count());
    }

    public function test_it_does_not_revoke_other_devices_tokens()
    {
        $device1 = Device::factory()->create();
        $device2 = Device::factory()->create();

        DeviceToken::factory()->create(['device_id' => $device1->id]);
        DeviceToken::factory()->create(['device_id' => $device2->id]);

        $action = app(RevokeActiveTokensAction::class);
        $action->execute(new RevokeTokensDTO($device1->id));

        $this->assertEquals(0, DeviceToken::where('device_id', $device1->id)->active()->count());
        $this->assertEquals(1, DeviceToken::where('device_id', $device2->id)->active()->count());
    }
}
