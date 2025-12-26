<?php

namespace Tests\Feature;

use App\Domain\Calls\Models\CallLog;
use App\Domain\Users\Models\User;
use App\Jobs\ProcessCallLogAnalytics;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CallClassificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_classify_a_call()
    {
        Queue::fake();

        $admin = User::factory()->create();
        Sanctum::actingAs($admin, ['*']);

        $callLog = CallLog::factory()->create();

        $payload = [
            'type' => 'BUSINESS',
            'reason' => 'Sales lead',
        ];

        $response = $this->postJson("/api/v1/admin/calls/{$callLog->id}/classify", $payload);

        $response->assertOk();
        $this->assertDatabaseHas('call_classifications', [
            'call_log_id' => $callLog->id,
            'type' => 'BUSINESS',
            'user_id' => $admin->id,
        ]);

        Queue::assertPushed(ProcessCallLogAnalytics::class);
    }

    public function test_guest_cannot_classify_calls()
    {
        $callLog = CallLog::factory()->create();

        $response = $this->postJson("/api/v1/admin/calls/{$callLog->id}/classify", [
            'type' => 'BUSINESS',
        ]);

        $response->assertUnauthorized();
    }
}
