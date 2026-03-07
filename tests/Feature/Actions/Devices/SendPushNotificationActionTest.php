<?php

declare(strict_types=1);

namespace Tests\Feature\Actions\Devices;

use App\Actions\Devices\SendPushNotificationAction;
use App\Domain\Devices\DTOs\StaleHeartbeatNotificationDTO;
use App\Domain\Devices\Models\Device;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Contract\Messaging;
use Mockery;
use Mockery\MockInterface;
use Tests\TestCase;

class SendPushNotificationActionTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_sends_a_push_notification_successfully(): void
    {
        $device = Device::factory()->create(['fcm_token' => 'valid-token']);
        $dto = new StaleHeartbeatNotificationDTO(
            device: $device,
            messageTitle: 'Test Title',
            messageBody: 'Test Body'
        );

        /** @var Messaging|MockInterface $messagingMock */
        $messagingMock = Mockery::mock(Messaging::class);
        $messagingMock->shouldReceive('send')->once()->andReturn([]);

        $action = new SendPushNotificationAction($messagingMock);

        Log::shouldReceive('info')->once()->with("Successfully sent FCM push notification to device {$device->id}");

        $result = $action->execute($dto);

        $this->assertTrue($result);
    }

    public function test_it_fails_and_logs_when_fcm_token_is_missing(): void
    {
        $device = Device::factory()->create(['fcm_token' => null]);
        $dto = new StaleHeartbeatNotificationDTO(
            device: $device,
            messageTitle: 'Test Title',
            messageBody: 'Test Body'
        );

        /** @var Messaging|MockInterface $messagingMock */
        $messagingMock = Mockery::mock(Messaging::class);
        $messagingMock->shouldNotReceive('send');

        $action = new SendPushNotificationAction($messagingMock);

        Log::shouldReceive('warning')->once()->with("Cannot send push notification: Device {$device->id} missing FCM token.");

        $result = $action->execute($dto);

        $this->assertFalse($result);
    }
}
