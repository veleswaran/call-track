"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@shared/components/ui/dialog";
import { Button } from "@shared/components/ui/button";
import { Textarea } from "@shared/components/ui/textarea";
import { useUpdateCallNote } from "@features/call-logs/hooks/use-update-call-note";
import type { CallLog } from "@shared/types";
import { Loader2 } from "lucide-react";

interface EditNoteDialogProps {
    callLog: CallLog | null;
    currentNote: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditNoteDialog({ callLog, currentNote, open, onOpenChange }: EditNoteDialogProps) {
    const [note, setNote] = useState(currentNote || "");
    const { mutate: updateNote, isPending } = useUpdateCallNote();

    // Removed useEffect. State is initialized on mount.
    // Parent should conditional render this component to reset state on new open.

    const handleSave = () => {
        if (!callLog || !note.trim()) return;

        // Get the current classification type, or default to BUSINESS if unclassified
        const classificationType = callLog.classification?.classification?.toUpperCase() as "BUSINESS" | "PERSONAL" | "IGNORED" || "BUSINESS";

        updateNote({
            callLogId: callLog.id,
            note: note.trim(),
            classificationType,
        }, {
            onSuccess: () => {
                onOpenChange(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Note</DialogTitle>
                    <DialogDescription>
                        Update the note for this call.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <Textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Enter call notes..."
                        className="min-h-[100px]"
                    />
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
                    <Button
                        onClick={handleSave}
                        disabled={isPending || !note.trim()}
                    >
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Note
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
