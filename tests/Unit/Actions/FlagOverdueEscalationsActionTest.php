<?php

declare(strict_types=1);

namespace Tests\Unit\Actions;

use App\Actions\Calls\FlagOverdueEscalationsAction;
use App\Domain\Agents\Models\Agent;
use App\Domain\Calls\Models\CallEscalation;
use App\Domain\Calls\Models\CallLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class FlagOverdueEscalationsActionTest extends TestCase
{
    use RefreshDatabase;

    private FlagOverdueEscalationsAction $action;

    protected function setUp(): void
    {
        parent::setUp();
        $this->action = new FlagOverdueEscalationsAction;
    }

    public function test_it_flags_overdue_escalations_as_unattended(): void
    {
        // 1. Setup: Create some escalations
        $agent = Agent::factory()->create();

        $missedCall1 = CallLog::factory()->create(['agent_id' => $agent->id]);
        $overdue = CallEscalation::create([
            'call_log_id' => $missedCall1->id,
            'status' => 'pending',
            'response_due_at' => Carbon::now()->subMinute(), // Past due
        ]);

        $missedCall2 = CallLog::factory()->create(['agent_id' => $agent->id]);
        $notOverdue = CallEscalation::create([
            'call_log_id' => $missedCall2->id,
            'status' => 'pending',
            'response_due_at' => Carbon::now()->addHour(), // Not past due
        ]);

        $missedCall3 = CallLog::factory()->create(['agent_id' => $agent->id]);
        $alreadyResolved = CallEscalation::create([
            'call_log_id' => $missedCall3->id,
            'status' => 'resolved',
            'response_due_at' => Carbon::now()->subHour(), // Past due but already resolved
        ]);

        // 2. Execute
        $flaggedCount = $this->action->execute();

        // 3. Assert
        $this->assertEquals(1, $flaggedCount);
        $this->assertEquals('unattended', $overdue->fresh()->status);
        $this->assertEquals('pending', $notOverdue->fresh()->status);
        $this->assertEquals('resolved', $alreadyResolved->fresh()->status);
    }
}
