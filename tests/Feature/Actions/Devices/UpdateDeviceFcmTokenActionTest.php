<?php

declare(strict_types=1);

namespace Tests\Feature\Actions\Devices;

use App\Actions\Devices\UpdateDeviceFcmTokenAction;
use App\Domain\Devices\DTOs\UpdateFcmTokenDTO;
use App\Domain\Devices\Models\Device;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UpdateDeviceFcmTokenActionTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_updates_the_device_fcm_token(): void
    {
        $device = Device::factory()->create(['fcm_token' => null]);
        $action = new UpdateDeviceFcmTokenAction;
        $dto = new UpdateFcmTokenDTO($device->id, 'test_token_123');

        $action->execute($dto);

        $this->assertEquals('test_token_123', $device->fresh()->fcm_token);
    }
}
