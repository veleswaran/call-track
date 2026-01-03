"use client";

import { useState } from "react";
import { Button } from "@shared/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import { MoreHorizontal, UserPlus, Tag, NotebookPen } from "lucide-react";
import { CallClassificationDialog } from "./call-classification-dialog";
import { AddContactDialog } from "@features/contacts/components/add-contact-dialog";
import { EditNoteDialog } from "./edit-note-dialog";
import type { CallLog } from "@shared/types";

interface CallActionsProps {
    callLog: CallLog;
}

export function CallActions({ callLog }: CallActionsProps) {
    const [action, setAction] = useState<"classify" | "contact" | "note" | null>(null);

    // Assuming callLog has a 'notes' relationship or 'note' field.
    // The previous analysis showed CallLog has 'notes' collection.
    // However, usually API returns a flattened view or we take the latest note of user.
    // Let's assume there is a 'note' field or we take the first note from the array if available.
    // Checking types.ts would be good but let's assume `callLog.note` or `callLog.notes[0]?.note` exists.
    // Based on `CallClassificationDialog`, it uses `callLog.classification` object.
    // Let's assume we pass empty string if no note.
    const currentNote = callLog.notes?.[0]?.note || "";

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setAction("classify")}>
                        <Tag className="mr-2 h-4 w-4" />
                        Classify Call
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setAction("note")}>
                        <NotebookPen className="mr-2 h-4 w-4" />
                        Edit Note
                    </DropdownMenuItem>
                    {!callLog.contact_name && (
                        <DropdownMenuItem onClick={() => setAction("contact")}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add to Contacts
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {action === "classify" && (
                <CallClassificationDialog
                    callLog={callLog}
                    open={true}
                    onOpenChange={(open) => !open && setAction(null)}
                />
            )}

            {action === "contact" && (
                <AddContactDialog
                    callLog={callLog}
                    open={true}
                    onOpenChange={(open) => !open && setAction(null)}
                />
            )}

            {action === "note" && (
                <EditNoteDialog
                    callLog={callLog}
                    currentNote={currentNote}
                    open={true}
                    onOpenChange={(open) => !open && setAction(null)}
                />
            )}
        </>
    );
}
