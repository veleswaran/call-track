import { render, screen, fireEvent } from "@testing-library/react";
import { ChangeRoleDialog } from "./change-role-dialog";
import { User } from "@shared/types";
import { describe, it, expect, vi } from "vitest";

// Mock hooks
const mockUpdateUserRole = vi.fn();
vi.mock("../hooks/use-users", () => ({
    useUpdateUserRole: () => ({
        mutate: mockUpdateUserRole,
        isPending: false,
    }),
}));

vi.mock("@features/auth/hooks/use-auth", () => ({
    useAuth: () => ({
        user: { role: "admin", roles: ["admin"], permissions: [] }, // Admin user
    }),
}));

// Mock UI components if necessary, but shallow rendering might be better or just rely on DOM
// Since we use Radix primitives, they should be testable.

describe("ChangeRoleDialog", () => {
    const mockUser: User = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        email_verified_at: null,
        roles: ["manager"],
        permissions: [],
        created_at: "",
        updated_at: "",
    };

    it("renders dialog when open", () => {
        render(
            <ChangeRoleDialog
                user={mockUser}
                open={true}
                onOpenChange={vi.fn()}
            />
        );
        expect(screen.getByText("Change User Role")).toBeInTheDocument();
        expect(screen.getByText("Update the role for Test User. careful, this affects their permissions.")).toBeInTheDocument();
    });

    it("calls updateRole when form is submitted", () => {
        render(
            <ChangeRoleDialog
                user={mockUser}
                open={true}
                onOpenChange={vi.fn()}
            />
        );

        // Select role - this might be tricky with Radix Select, simpler to just find the button and click save 
        // assuming default value is selected or just testing submission.
        const submitButton = screen.getByText("Save changes");
        fireEvent.click(submitButton);

        expect(mockUpdateUserRole).toHaveBeenCalled();
        // Check arguments if possible
        expect(mockUpdateUserRole).toHaveBeenCalledWith(
            expect.objectContaining({ id: 1 }), // Role might be default 'manager' (from mockUser) or 'member' fallback
            expect.anything()
        );
    });
});
