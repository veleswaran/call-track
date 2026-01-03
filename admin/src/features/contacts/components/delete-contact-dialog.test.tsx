import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeleteContactDialog } from "./delete-contact-dialog";
import type { Contact } from "@shared/types";

const mockDeleteContact = vi.fn();
vi.mock("@features/contacts/hooks/use-delete-contact", () => ({
    useDeleteContact: () => ({
        mutate: mockDeleteContact,
        isPending: false,
    }),
}));

const mockContact = {
    id: 1,
    name: "John Doe",
    phone_number: "1234567890",
} as Contact;

describe("DeleteContactDialog", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders confirmation message", () => {
        render(
            <DeleteContactDialog
                contact={mockContact}
                open={true}
                onOpenChange={() => { }}
            />
        );

        expect(screen.getByText("Delete Contact")).toBeInTheDocument();
        expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("calls delete mutation on confirmation", async () => {
        const onOpenChange = vi.fn();
        render(
            <DeleteContactDialog
                contact={mockContact}
                open={true}
                onOpenChange={onOpenChange}
            />
        );

        const deleteButton = screen.getByRole("button", { name: "Delete" });
        fireEvent.click(deleteButton);

        await waitFor(() => {
            expect(mockDeleteContact).toHaveBeenCalledWith(1, expect.any(Object));
        });
    });

    it("closes on cancel", () => {
        const onOpenChange = vi.fn();
        render(
            <DeleteContactDialog
                contact={mockContact}
                open={true}
                onOpenChange={onOpenChange}
            />
        );

        fireEvent.click(screen.getByText("Cancel"));
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });
});
