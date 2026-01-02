import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EditContactDialog } from "./edit-contact-dialog";
import type { Contact } from "@shared/types";
import userEvent from "@testing-library/user-event";

const mockUpdateContact = vi.fn();
vi.mock("@features/contacts/hooks/use-update-contact", () => ({
    useUpdateContact: () => ({
        mutate: mockUpdateContact,
        isPending: false,
    }),
}));

const mockContact = {
    id: 1,
    name: "John Doe",
    phone_number: "1234567890",
} as Contact;

describe("EditContactDialog", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders correctly with contact data", () => {
        render(
            <EditContactDialog
                contact={mockContact}
                open={true}
                onOpenChange={() => { }}
            />
        );

        expect(screen.getByText("Edit Contact")).toBeInTheDocument();
        expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
        expect(screen.getByDisplayValue("1234567890")).toBeInTheDocument();
    });

    it("submits updated data", async () => {
        const onOpenChange = vi.fn();
        render(
            <EditContactDialog
                contact={mockContact}
                open={true}
                onOpenChange={onOpenChange}
            />
        );

        const nameInput = screen.getByDisplayValue("John Doe");
        await userEvent.clear(nameInput);
        await userEvent.type(nameInput, "Jane Doe");

        const saveButton = screen.getByText("Save Changes");
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(mockUpdateContact).toHaveBeenCalledWith(
                {
                    id: 1,
                    data: {
                        name: "Jane Doe",
                        phone_number: "1234567890",
                    },
                },
                expect.any(Object)
            );
        });
    });

    it("closes on cancel", () => {
        const onOpenChange = vi.fn();
        render(
            <EditContactDialog
                contact={mockContact}
                open={true}
                onOpenChange={onOpenChange}
            />
        );

        fireEvent.click(screen.getByText("Cancel"));
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });
});
