<?php

declare(strict_types=1);

namespace Tests\Unit\Actions\Devices;

use App\Actions\Devices\RevokeActiveTokensAction;
use App\Domain\Devices\DTOs\RevokeTokensDTO;
use App\Domain\Devices\Models\Device;
use App\Domain\Devices\Models\DeviceToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RevokeActiveTokensActionTest extends TestCase
{
    use RefreshDatabase;

    private RevokeActiveTokensAction $action;

    protected function setUp(): void
    {
        parent::setUp();
        $this->action = new RevokeActiveTokensAction;
    }

    public function test_it_revokes_all_active_tokens_for_device(): void
    {
        $device = Device::factory()->create();

        // 2 active tokens
        DeviceToken::factory()->count(2)->create([
            'device_id' => $device->id,
            'revoked_at' => null,
            'expires_at' => now()->addDay(),
        ]);

        // 1 already revoked token
        DeviceToken::factory()->create([
            'device_id' => $device->id,
            'revoked_at' => now()->subDay(),
        ]);

        // 1 token for another device
        $otherDevice = Device::factory()->create();
        DeviceToken::factory()->create([
            'device_id' => $otherDevice->id,
            'revoked_at' => null,
        ]);

        $dto = new RevokeTokensDTO(
            deviceId: $device->id,
            reason: 'test'
        );

        $count = $this->action->execute($dto);

        $this->assertEquals(2, $count);

        // Verify tokens are revoked
        $this->assertEquals(3, DeviceToken::where('device_id', $device->id)->whereNotNull('revoked_at')->count());

        // Verify other device token is NOT revoked
        $this->assertEquals(0, DeviceToken::where('device_id', $otherDevice->id)->whereNotNull('revoked_at')->count());
    }
}
