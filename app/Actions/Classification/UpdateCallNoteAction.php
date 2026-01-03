<?php

declare(strict_types=1);

namespace App\Actions\Classification;

use App\Domain\Calls\Models\CallLog;
use App\Domain\Classification\Models\CallNote;
use App\Domain\Users\Models\User;

class UpdateCallNoteAction
{
    public function execute(CallLog $callLog, string $noteContent, User $user): CallNote
    {
        // We use updateOrCreate to handle cases where a note might not exist yet
        // (though typically classification creates it, we want robust handling).
        // However, CallLog hasMany CallNotes in the model file I saw earlier?
        // Let's re-verify if it's hasOne or hasMany.
        // The model file `CallLog` had: public function notes(): HasMany
        // But `CallNote` seems to linked to a user/agent.
        // If we want to "edit" a note, are we editing a specific note ID or "the" note for the call?
        // The request is "edit call notes". Usually this implies a single mutable note or a thread.
        // Given complexity, I will assume we are appending or updating the *latest* note or creating a new one?
        //
        // Wait, looking at current `CallLog` model viewed in step 12:
        // public function notes(): HasMany (collection)
        //
        // If the UI shows "Edit Note", it implies there's one note or we are editing a specific one.
        // The prompt says "edit call notes from /call-logs page".
        // Usually simpler systems have one note.
        // Let's assume we are adding a NEW note or updating the existing one if it belongs to the user?
        //
        // Simplest interpretation: Add a new note or update the "main" note.
        // Let's look at `CallClassification` - it is `hasOne`.
        //
        // If I look at the implementation plan, I proposed: `update(Request $request, $callLogId)`
        // This suggests updating "the" note for the call log.
        //
        // Let's implement `updateOrCreate` logic where we find the latest note or create one.
        // OR, strictly following the "append only" or "audit" nature of enterprise apps, maybe we shouldn't overwrite?
        //
        // But the user asked for "EDIT". So we will update.
        // I'll update the *latest* note if it exists, or create one.

        /** @var \App\Domain\Classification\Models\CallNote|null $note */
        $note = $callLog->notes()->latest()->first();

        if ($note) {
            $note->update([
                'note' => $noteContent,
            ]);

            return $note;
        }

        /** @var \App\Domain\Classification\Models\CallNote */
        return $callLog->notes()->create([
            'user_id' => $user->id,
            'note' => $noteContent,
        ]);
    }
}
