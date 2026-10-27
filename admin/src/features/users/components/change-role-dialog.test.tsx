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

let mockCurrentUser: { role: string; roles: string[]; permissions: string[] } | null = {
    role: "admin",
    roles: ["admin"],
    permissions: [],
};

vi.mock("@features/auth/hooks/use-auth", () => ({
    useAuth: () => ({
        user: mockCurrentUser,
    }),
}));

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

    it("calls updateRole when form is submitted and calls onSuccess callback", () => {
        const onOpenChange = vi.fn();
        mockUpdateUserRole.mockImplementation((_data, options) => {
            if (options?.onSuccess) {
                options.onSuccess();
            }
        });

        render(
            <ChangeRoleDialog
                user={mockUser}
                open={true}
                onOpenChange={onOpenChange}
            />
        );

        const submitButton = screen.getByText("Save changes");
        fireEvent.click(submitButton);

        expect(mockUpdateUserRole).toHaveBeenCalledWith(
            expect.objectContaining({ id: 1, role: "manager" }),
            expect.anything()
        );
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("calls onOpenChange(false) when cancel button is clicked", () => {
        const onOpenChange = vi.fn();
        render(
            <ChangeRoleDialog
                user={mockUser}
                open={true}
                onOpenChange={onOpenChange}
            />
        );

        const cancelButton = screen.getByText("Cancel");
        fireEvent.click(cancelButton);

        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("handles super-admin currentUser and user with no roles", () => {
        mockCurrentUser = {
            role: "super-admin",
            roles: ["super-admin"],
            permissions: [],
        };

        const userWithoutRoles: User = {
            ...mockUser,
            roles: [],
        };

        render(
            <ChangeRoleDialog
                user={userWithoutRoles}
                open={true}
                onOpenChange={vi.fn()}
            />
        );

        expect(screen.getByText("Change User Role")).toBeInTheDocument();
    });
});
