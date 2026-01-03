import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EditNoteDialog } from "./edit-note-dialog";
import type { CallLog } from "@shared/types";
import userEvent from "@testing-library/user-event";

// Mock the hook
const mockUpdateCallNote = vi.fn();
vi.mock("@features/call-logs/hooks/use-update-call-note", () => ({
    useUpdateCallNote: () => ({
        mutate: mockUpdateCallNote,
        isPending: false,
    }),
}));

const mockCallLog = {
    id: 1,
    phone_number: "1234567890",
    direction: "incoming",
} as unknown as CallLog;

describe("EditNoteDialog", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders correctly when open", () => {
        render(
            <EditNoteDialog
                callLog={mockCallLog}
                currentNote="Existing note"
                open={true}
                onOpenChange={() => { }}
            />
        );

        expect(screen.getByText("Edit Note")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Existing note")).toBeInTheDocument();
    });

    it("updates note state and calls mutation on save", async () => {
        const onOpenChange = vi.fn();
        render(
            <EditNoteDialog
                callLog={mockCallLog}
                currentNote=""
                open={true}
                onOpenChange={onOpenChange}
            />
        );

        const textarea = screen.getByRole("textbox");
        await userEvent.type(textarea, "New Note Content");

        const saveButton = screen.getByText("Save Note");
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(mockUpdateCallNote).toHaveBeenCalledWith(
                {
                    callLogId: 1,
                    note: "New Note Content",
                },
                expect.objectContaining({
                    onSuccess: expect.any(Function),
                })
            );
        });

        // Trigger onSuccess to check if dialog closes
        const mutationCallOptions = mockUpdateCallNote.mock.calls[0][1];
        mutationCallOptions.onSuccess();
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });
});
