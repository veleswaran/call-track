<?php

declare(strict_types=1);

namespace Tests\Feature\Console\Commands;

use App\Domain\Devices\Models\Device;
use App\Domain\Devices\Models\DeviceToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Kreait\Firebase\Contract\Messaging;
use Tests\TestCase;

class NotifyStaleDevicesCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_sends_fcm_notification_to_stale_devices(): void
    {
        // 1. Create a device with a stale heartbeat (> 60 minutes) and FCM token
        $device = Device::factory()->create([
            'fcm_token' => 'mock-fcm-token',
            'last_heartbeat_at' => Carbon::now()->subMinutes(120),
        ]);

        // 2. Add an active device token so it satisfies ->whereHas('activeTokens')
        DeviceToken::create([
            'device_id' => $device->id,
            'token_hash' => 'mock-hash',
            'device_name' => $device->name,
            'issued_at' => Carbon::now()->subDays(5),
            'last_used_at' => Carbon::now()->subMinutes(120),
        ]);

        // 3. Mock Firebase Messaging Contract
        $messagingMock = $this->createMock(Messaging::class);
        $messagingMock->expects($this->once())
            ->method('send');

        $this->app->instance(Messaging::class, $messagingMock);

        // 4. Run the artisan command
        $this->artisan('devices:notify-stale')
            ->expectsOutput('Finding stale devices and sending FCM notifications...')
            ->expectsOutput('Successfully sent 1 push notifications.')
            ->assertExitCode(0);
    }

    public function test_it_does_not_notify_devices_with_fresh_heartbeat(): void
    {
        // 1. Create a device with a fresh heartbeat (10 minutes ago)
        $device = Device::factory()->create([
            'fcm_token' => 'mock-fcm-token',
            'last_heartbeat_at' => Carbon::now()->subMinutes(10),
        ]);

        DeviceToken::create([
            'device_id' => $device->id,
            'token_hash' => 'mock-hash',
            'device_name' => $device->name,
            'issued_at' => Carbon::now()->subDays(5),
            'last_used_at' => Carbon::now()->subMinutes(10),
        ]);

        // 2. Mock Firebase Messaging Contract (should never be called)
        $messagingMock = $this->createMock(Messaging::class);
        $messagingMock->expects($this->never())
            ->method('send');

        $this->app->instance(Messaging::class, $messagingMock);

        // 3. Run the artisan command
        $this->artisan('devices:notify-stale')
            ->expectsOutput('Finding stale devices and sending FCM notifications...')
            ->expectsOutput('Successfully sent 0 push notifications.')
            ->assertExitCode(0);
    }
}
