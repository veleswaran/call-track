<?php

namespace Tests\Feature\Admin;

use App\Domain\Calls\Models\CallLog;
use App\Domain\Users\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CallNoteControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->actingAs($this->user, 'sanctum');
    }

    public function test_can_update_call_note()
    {
        $callLog = CallLog::factory()->create();

        $response = $this->putJson("/api/v1/admin/calls/{$callLog->id}/note", [
            'note' => 'Note from Controller',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'note' => 'Note from Controller',
                'call_log_id' => $callLog->id,
            ]);

        $this->assertDatabaseHas('call_notes', [
            'call_log_id' => $callLog->id,
            'note' => 'Note from Controller',
        ]);
    }
}
