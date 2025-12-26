<?php

namespace Tests\Unit\Actions;

use App\Actions\Classification\ClassifyCallAction;
use App\Domain\Calls\Models\CallLog;
use App\Domain\Classification\DTOs\CallClassificationDTO;
use App\Domain\Classification\Models\CallClassification;
use App\Domain\Users\Models\User;
use App\Jobs\ProcessCallLogAnalytics;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class ClassifyCallActionTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_classifies_a_call_and_triggers_analytics()
    {
        Queue::fake();

        $callLog = CallLog::factory()->create();
        $admin = User::factory()->create();

        $dto = new CallClassificationDTO(
            callLogId: $callLog->id,
            adminUserId: $admin->id,
            type: 'BUSINESS',
            reason: 'Work related'
        );

        $action = new ClassifyCallAction();
        $action->execute($dto);

        $this->assertDatabaseHas('call_classifications', [
            'call_log_id' => $callLog->id,
            'user_id' => $admin->id,
            'type' => 'BUSINESS',
            'reason' => 'Work related',
        ]);

        Queue::assertPushed(ProcessCallLogAnalytics::class, function ($job) use ($callLog) {
            return $job->deviceId === $callLog->device_id;
        });
    }

    public function test_it_updates_existing_classification()
    {
        Queue::fake();

        $callLog = CallLog::factory()->create();
        $admin = User::factory()->create();

        // Existing classification
        CallClassification::create([
            'call_log_id' => $callLog->id,
            'user_id' => $admin->id,
            'type' => 'PERSONAL',
        ]);

        $dto = new CallClassificationDTO(
            callLogId: $callLog->id,
            adminUserId: $admin->id,
            type: 'BUSINESS',
            reason: 'Correction'
        );

        $action = new ClassifyCallAction();
        $action->execute($dto);

        $this->assertDatabaseHas('call_classifications', [
            'call_log_id' => $callLog->id,
            'type' => 'BUSINESS',
            'reason' => 'Correction',
        ]);
        
        // Ensure only one record exists
        $this->assertEquals(1, CallClassification::where('call_log_id', $callLog->id)->count());
    }
}
