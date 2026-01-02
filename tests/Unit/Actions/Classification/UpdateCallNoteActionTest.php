<?php

namespace Tests\Unit\Actions\Classification;

use App\Actions\Classification\UpdateCallNoteAction;
use App\Domain\Calls\Models\CallLog;
use App\Domain\Classification\Models\CallNote;
use App\Domain\Users\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UpdateCallNoteActionTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_a_new_note_if_none_exists()
    {
        $callLog = CallLog::factory()->create();
        $user = User::factory()->create();

        $action = new UpdateCallNoteAction;
        $note = $action->execute($callLog, 'This is a new note.', $user);

        $this->assertEquals('This is a new note.', $note->note);
        $this->assertEquals($user->id, $note->user_id);
        $this->assertEquals($callLog->id, $note->call_log_id);
    }

    public function test_it_updates_existing_note()
    {
        $callLog = CallLog::factory()->create();
        $user = User::factory()->create();
        $oldNote = CallNote::factory()->create([
            'call_log_id' => $callLog->id,
            'user_id' => $user->id,
            'note' => 'Old note content',
        ]);

        $action = new UpdateCallNoteAction;
        $note = $action->execute($callLog, 'Updated content', $user);

        $this->assertEquals($oldNote->id, $note->id);
        $this->assertEquals('Updated content', $note->note);
    }
}
