<?php

namespace Tests\Unit\Actions;

use App\Actions\Calls\IngestCallLogsAction;
use App\Domain\Calls\DTOs\CallLogData;
use App\Domain\Calls\DTOs\SyncCallLogsDTO;
use App\Domain\Calls\Models\CallLog;
use App\Domain\Devices\Models\Device;
use App\Jobs\ProcessCallLogAnalytics;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class IngestCallLogsActionTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_ingests_call_logs_and_hashes_phones()
    {
        Queue::fake();

        $device = Device::factory()->create();
        $logData = new CallLogData(
            callHash: 'unique-hash-123',
            phoneNumber: '+1234567890',
            direction: 'incoming',
            duration: 120,
            timestamp: now()->toDateTimeString(),
        );

        $dto = new SyncCallLogsDTO(
            device: $device,
            logs: [$logData]
        );

        $action = new IngestCallLogsAction;
        $action->execute($dto);

        $this->assertDatabaseHas('call_logs', [
            'device_id' => $device->id,
            'call_hash' => 'unique-hash-123',
            // Phone is normalized before hashing: +1234567890 → 1234567890
            'phone_number_hash' => hash('sha256', '1234567890'),
            'duration' => 120,
        ]);

        Queue::assertPushed(ProcessCallLogAnalytics::class, function ($job) use ($device) {
            return $job->deviceId === $device->id;
        });
    }

    public function test_it_is_idempotent()
    {
        Queue::fake();

        $device = Device::factory()->create();
        $logData = new CallLogData(
            callHash: 'same-hash',
            phoneNumber: '+1234567890',
            direction: 'incoming',
            duration: 120,
            timestamp: now()->toDateTimeString(),
        );

        $dto = new SyncCallLogsDTO(
            device: $device,
            logs: [$logData]
        );

        $action = new IngestCallLogsAction;
        $action->execute($dto);
        $action->execute($dto); // Run twice

        $this->assertEquals(1, CallLog::count());
    }
}
