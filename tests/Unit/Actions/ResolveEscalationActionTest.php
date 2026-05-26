<?php

declare(strict_types=1);

namespace Tests\Unit\Actions;

use App\Actions\Calls\ResolveEscalationAction;
use App\Domain\Agents\Models\Agent;
use App\Domain\Calls\Models\CallEscalation;
use App\Domain\Calls\Models\CallLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ResolveEscalationActionTest extends TestCase
{
    use RefreshDatabase;

    private ResolveEscalationAction $action;

    protected function setUp(): void
    {
        parent::setUp();
        $this->action = new ResolveEscalationAction;
    }

    public function test_it_resolves_pending_escalation_on_outgoing_call(): void
    {
        // 1. Setup: Agent and a phone number
        $agent = Agent::factory()->create();
        $phoneNumber = '1234567890';
        $hash = hash('sha256', $phoneNumber);

        // 2. Setup: A missed call that created a pending escalation
        $missedCall = CallLog::factory()->create([
            'agent_id' => $agent->id,
            'phone_number' => $phoneNumber,
            'phone_number_hash' => $hash,
            'direction' => 'MISSED',
            'timestamp' => now()->subMinutes(10),
        ]);

        $escalation = CallEscalation::create([
            'call_log_id' => $missedCall->id,
            'status' => 'pending',
            'response_due_at' => now()->addMinutes(20),
        ]);

        // 3. Setup: An outgoing call from the same agent to the same number
        $outgoingCall = CallLog::factory()->create([
            'agent_id' => $agent->id,
            'phone_number' => $phoneNumber,
            'phone_number_hash' => $hash,
            'direction' => 'OUTGOING',
            'duration' => 30, // Must be > 0
            'timestamp' => now()->subMinutes(5),
        ]);

        // 4. Execute
        $resolvedCount = $this->action->execute($outgoingCall);

        // 5. Assert
        $this->assertEquals(1, $resolvedCount);
        $this->assertEquals('resolved', $escalation->fresh()->status);
        $this->assertEquals($outgoingCall->timestamp->toDateTimeString(), $escalation->fresh()->resolved_at->toDateTimeString());
        $this->assertEquals($outgoingCall->id, $escalation->fresh()->resolved_by_call_id);
    }

    public function test_it_does_not_resolve_if_duration_is_zero(): void
    {
        $agent = Agent::factory()->create();
        $phoneNumber = '1234567890';
        $hash = hash('sha256', $phoneNumber);

        $missedCall = CallLog::factory()->create([
            'agent_id' => $agent->id,
            'phone_number' => $phoneNumber,
            'phone_number_hash' => $hash,
            'direction' => 'MISSED',
            'timestamp' => now()->subMinutes(10),
        ]);

        $escalation = CallEscalation::create([
            'call_log_id' => $missedCall->id,
            'status' => 'pending',
            'response_due_at' => now()->addHour(),
        ]);

        $outgoingCall = CallLog::factory()->create([
            'agent_id' => $agent->id,
            'phone_number' => $phoneNumber,
            'phone_number_hash' => $hash,
            'direction' => 'OUTGOING',
            'duration' => 0, // Zero duration should not resolve
            'timestamp' => now(),
        ]);

        $resolvedCount = $this->action->execute($outgoingCall);

        $this->assertEquals(0, $resolvedCount);
        $this->assertEquals('pending', $escalation->fresh()->status);
    }

    public function test_it_does_not_resolve_if_different_agent(): void
    {
        $agent1 = Agent::factory()->create();
        $agent2 = Agent::factory()->create();
        $phoneNumber = '1234567890';
        $hash = hash('sha256', $phoneNumber);

        $missedCall = CallLog::factory()->create([
            'agent_id' => $agent1->id,
            'phone_number' => $phoneNumber,
            'phone_number_hash' => $hash,
            'direction' => 'MISSED',
            'timestamp' => now()->subMinutes(10),
        ]);

        $escalation = CallEscalation::create([
            'call_log_id' => $missedCall->id,
            'status' => 'pending',
            'response_due_at' => now()->addHour(),
        ]);

        // Outgoing call from DIFFERENT agent
        $outgoingCall = CallLog::factory()->create([
            'agent_id' => $agent2->id,
            'phone_number' => $phoneNumber,
            'phone_number_hash' => $hash,
            'direction' => 'OUTGOING',
            'duration' => 60,
            'timestamp' => now(),
        ]);

        $resolvedCount = $this->action->execute($outgoingCall);

        $this->assertEquals(0, $resolvedCount);
        $this->assertEquals('pending', $escalation->fresh()->status);
    }

    public function test_it_resolves_pending_escalation_on_incoming_connected_call(): void
    {
        // 1. Setup: Agent and a phone number
        $agent = Agent::factory()->create();
        $phoneNumber = '1234567890';
        $hash = hash('sha256', $phoneNumber);

        // 2. Setup: A missed call that created a pending escalation
        $missedCall = CallLog::factory()->create([
            'agent_id' => $agent->id,
            'phone_number' => $phoneNumber,
            'phone_number_hash' => $hash,
            'direction' => 'MISSED',
            'timestamp' => now()->subMinutes(10),
        ]);

        $escalation = CallEscalation::create([
            'call_log_id' => $missedCall->id,
            'status' => 'pending',
            'response_due_at' => now()->addMinutes(20),
        ]);

        // 3. Setup: An incoming call from the same agent to the same number
        $incomingCall = CallLog::factory()->create([
            'agent_id' => $agent->id,
            'phone_number' => $phoneNumber,
            'phone_number_hash' => $hash,
            'direction' => 'INCOMING',
            'duration' => 30, // Must be > 0
            'timestamp' => now()->subMinutes(5),
        ]);

        // 4. Execute
        $resolvedCount = $this->action->execute($incomingCall);

        // 5. Assert
        $this->assertEquals(1, $resolvedCount);
        $this->assertEquals('resolved', $escalation->fresh()->status);
        $this->assertEquals($incomingCall->timestamp->toDateTimeString(), $escalation->fresh()->resolved_at->toDateTimeString());
        $this->assertEquals($incomingCall->id, $escalation->fresh()->resolved_by_call_id);
    }
}
