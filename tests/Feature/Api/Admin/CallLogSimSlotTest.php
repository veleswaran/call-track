<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Admin;

use App\Domain\Calls\Models\CallLog;
use App\Domain\Users\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CallLogSimSlotTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create();
        Sanctum::actingAs($this->admin);
    }

    public function test_can_filter_call_logs_by_sim_slot(): void
    {
        // Create logs with different sim slots
        $logSlot0 = CallLog::factory()->create(['sim_slot' => 0]);
        $logSlot1 = CallLog::factory()->create(['sim_slot' => 1]);
        $logSlot2 = CallLog::factory()->create(['sim_slot' => 2]);

        // Filter by slot 1
        $response = $this->getJson('/api/v1/admin/call-logs?sim_slot=1');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $logSlot1->id)
            ->assertJsonPath('data.0.sim_slot', 1);

        // Filter by slot 0
        $response = $this->getJson('/api/v1/admin/call-logs?sim_slot=0');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $logSlot0->id)
            ->assertJsonPath('data.0.sim_slot', 0);
    }

    public function test_sim_slot_is_included_in_response(): void
    {
        $log = CallLog::factory()->create(['sim_slot' => 1]);

        $response = $this->getJson('/api/v1/admin/call-logs');

        $response->assertOk()
            ->assertJsonPath('data.0.sim_slot', 1);
    }
}
