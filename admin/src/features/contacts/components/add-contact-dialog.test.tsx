import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AddContactDialog } from "./add-contact-dialog";
import type { CallLog } from "@shared/types";

// Mock the useCreateContact hook
vi.mock("@features/contacts/hooks/use-create-contact", () => ({
    useCreateContact: () => ({
        mutate: vi.fn(),
        isPending: false,
    }),
}));

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
            mutations: {
                retry: false,
            },
        },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    wrapper.displayName = "QueryClientWrapper";
    return wrapper;
}

const mockCallLog: CallLog = {
    id: 1,
    device_id: 1,
    phone_number: "+1234567890",
    contact_name: null,
    contact_notes: null,
    call_type: "incoming",
    duration: 120,
    timestamp: "2024-01-01T12:00:00Z",
    classification: null,
    created_at: "2024-01-01T00:00:00Z",
};

describe("AddContactDialog", () => {
    const mockOnOpenChange = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should render in call log mode with pre-filled phone number", () => {
        render(
            <AddContactDialog
                callLog={mockCallLog}
                open={true}
                onOpenChange={mockOnOpenChange}
            />,
            { wrapper: createWrapper() }
        );

        expect(screen.getByText("Add Contact")).toBeInTheDocument();
        expect(screen.getByDisplayValue("+1234567890")).toBeDisabled();
        expect(screen.getByPlaceholderText("John Doe")).toBeEnabled();
    });

    it("should render in standalone mode with editable phone number", () => {
        render(
            <AddContactDialog
                open={true}
                onOpenChange={mockOnOpenChange}
            />,
            { wrapper: createWrapper() }
        );

        expect(screen.getByText("Add Contact")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("9876543210")).toBeEnabled();
        expect(screen.getByPlaceholderText("John Doe")).toBeEnabled();
    });

    it("should show correct description in standalone mode", () => {
        render(
            <AddContactDialog
                open={true}
                onOpenChange={mockOnOpenChange}
            />,
            { wrapper: createWrapper() }
        );

        expect(screen.getByText("Create a new contact entry")).toBeInTheDocument();
    });

    it("should show correct description in call log mode", () => {
        render(
            <AddContactDialog
                callLog={mockCallLog}
                open={true}
                onOpenChange={mockOnOpenChange}
            />,
            { wrapper: createWrapper() }
        );

        expect(
            screen.getByText("Save this phone number to contacts properly")
        ).toBeInTheDocument();
    });

    it("should allow entering name in the form", () => {
        render(
            <AddContactDialog
                callLog={mockCallLog}
                open={true}
                onOpenChange={mockOnOpenChange}
            />,
            { wrapper: createWrapper() }
        );

        const nameInput = screen.getByPlaceholderText("John Doe");
        fireEvent.change(nameInput, { target: { value: "Jane Smith" } });

        expect(nameInput).toHaveValue("Jane Smith");
    });

    it("should allow entering phone number in standalone mode", () => {
        render(
            <AddContactDialog
                open={true}
                onOpenChange={mockOnOpenChange}
            />,
            { wrapper: createWrapper() }
        );

        const phoneInput = screen.getByPlaceholderText("9876543210");
        fireEvent.change(phoneInput, { target: { value: "9876543210" } });

        expect(phoneInput).toHaveValue("9876543210");
    });

    it("should disable save button when name is empty", () => {
        render(
            <AddContactDialog
                callLog={mockCallLog}
                open={true}
                onOpenChange={mockOnOpenChange}
            />,
            { wrapper: createWrapper() }
        );

        const saveButton = screen.getByRole("button", { name: /save/i });
        expect(saveButton).toBeDisabled();
    });

    it("should disable save button in standalone mode when phone or name is empty", () => {
        render(
            <AddContactDialog
                open={true}
                onOpenChange={mockOnOpenChange}
            />,
            { wrapper: createWrapper() }
        );

        const saveButton = screen.getByRole("button", { name: /save/i });
        expect(saveButton).toBeDisabled();

        // Fill only name
        const nameInput = screen.getByPlaceholderText("John Doe");
        fireEvent.change(nameInput, { target: { value: "Jane Smith" } });
        expect(saveButton).toBeDisabled();

        // Fill phone number too
        const phoneInput = screen.getByPlaceholderText("9876543210");
        fireEvent.change(phoneInput, { target: { value: "9876543210" } });
        expect(saveButton).toBeEnabled();
    });

    it("should call onOpenChange when cancel button is clicked", () => {
        render(
            <AddContactDialog
                callLog={mockCallLog}
                open={true}
                onOpenChange={mockOnOpenChange}
            />,
            { wrapper: createWrapper() }
        );

        const cancelButton = screen.getByRole("button", { name: /cancel/i });
        fireEvent.click(cancelButton);

        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it("should not render when open is false", () => {
        const { container } = render(
            <AddContactDialog
                callLog={mockCallLog}
                open={false}
                onOpenChange={mockOnOpenChange}
            />,
            { wrapper: createWrapper() }
        );

        expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
    });
});
