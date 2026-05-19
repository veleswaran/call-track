<?php

declare(strict_types=1);

namespace Tests\Feature\Console\Commands;

use App\Domain\Calls\Models\CallEscalation;
use App\Domain\Calls\Models\CallLog;
use App\Domain\Devices\Models\Device;
use App\Domain\Devices\Models\DeviceToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Kreait\Firebase\Contract\Messaging;
use Tests\TestCase;

class NotifyUnattendedMissedCallsCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_notifies_unattended_missed_calls(): void
    {
        // 1. Create a device with FCM token and active token
        $device = Device::factory()->create([
            'fcm_token' => 'mock-device-fcm-token',
            'status' => 'active',
        ]);

        DeviceToken::create([
            'device_id' => $device->id,
            'token_hash' => 'mock-hash',
            'device_name' => $device->name,
            'issued_at' => Carbon::now()->subDays(1),
            'last_used_at' => Carbon::now(),
        ]);

        // 2. Create a call log
        $callLog = CallLog::create([
            'device_id' => $device->id,
            'agent_id' => $device->agent_id,
            'call_hash' => 'mock-call-hash',
            'phone_number_hash' => hash('sha256', '+919999999999'),
            'phone_number' => '+919999999999',
            'direction' => 'MISSED',
            'duration' => 0,
            'timestamp' => Carbon::now()->subHours(2),
        ]);

        // 3. Create an unattended escalation without notification timestamp
        $escalation = CallEscalation::create([
            'call_log_id' => $callLog->id,
            'status' => 'unattended',
            'response_due_at' => Carbon::now()->subHours(1),
            'notified_at' => null,
        ]);

        // 4. Mock FCM messaging
        $messagingMock = $this->createMock(Messaging::class);
        $messagingMock->expects($this->once())
            ->method('send');

        $this->app->instance(Messaging::class, $messagingMock);

        // 5. Run the artisan command
        $this->artisan('calls:notify-unattended')
            ->expectsOutput('Finding unattended missed calls and sending FCM notifications...')
            ->expectsOutput('Successfully sent 1 push notifications for unattended missed calls.')
            ->assertExitCode(0);

        // 6. Assert notified_at was updated
        $escalation->refresh();
        $this->assertNotNull($escalation->notified_at);
    }

    public function test_it_does_not_notify_already_notified_escalations(): void
    {
        $device = Device::factory()->create([
            'fcm_token' => 'mock-device-fcm-token',
            'status' => 'active',
        ]);

        DeviceToken::create([
            'device_id' => $device->id,
            'token_hash' => 'mock-hash',
            'device_name' => $device->name,
            'issued_at' => Carbon::now()->subDays(1),
            'last_used_at' => Carbon::now(),
        ]);

        $callLog = CallLog::create([
            'device_id' => $device->id,
            'agent_id' => $device->agent_id,
            'call_hash' => 'mock-call-hash',
            'phone_number_hash' => hash('sha256', '+919999999999'),
            'phone_number' => '+919999999999',
            'direction' => 'MISSED',
            'duration' => 0,
            'timestamp' => Carbon::now()->subHours(2),
        ]);

        // Already notified escalation
        CallEscalation::create([
            'call_log_id' => $callLog->id,
            'status' => 'unattended',
            'response_due_at' => Carbon::now()->subHours(1),
            'notified_at' => Carbon::now()->subMinutes(10),
        ]);

        $messagingMock = $this->createMock(Messaging::class);
        $messagingMock->expects($this->never())
            ->method('send');

        $this->app->instance(Messaging::class, $messagingMock);

        $this->artisan('calls:notify-unattended')
            ->expectsOutput('Finding unattended missed calls and sending FCM notifications...')
            ->expectsOutput('Successfully sent 0 push notifications for unattended missed calls.')
            ->assertExitCode(0);
    }
}
