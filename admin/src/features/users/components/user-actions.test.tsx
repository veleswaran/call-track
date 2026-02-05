import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserActions } from "./user-actions";
import { useAuth } from "@features/auth/hooks/use-auth";
import { useDeleteUser, useResetTwoFactor } from "../hooks/use-users";
import { vi, describe, it, expect, beforeEach, Mock } from "vitest";

// Mock hooks
vi.mock("@features/auth/hooks/use-auth");
vi.mock("../hooks/use-users");
vi.mock("@shared/components/ui/button", () => ({
    Button: ({ children, ...props }: React.ComponentProps<"button">) => <button {...props}>{children}</button>,
}));

// Mock Dialog component since it's complex
vi.mock("./change-role-dialog", () => ({
    ChangeRoleDialog: ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => (
        open ? <div data-testid="change-role-dialog">
            Change Role Dialog
            <button onClick={() => onOpenChange(false)}>Close</button>
        </div> : null
    ),
}));

// Mock clipboard
// Moved inside specific tests to avoid conflicts with userEvent

window.confirm = vi.fn();

describe("UserActions", () => {
    const mockUser = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        roles: ["member"],
        two_factor_enabled: false,
        created_at: "2024-01-01",
        email_verified_at: "2024-01-01",
        updated_at: "2024-01-01",
        permissions: [],
    };

    const mockDeleteUser = vi.fn();
    const mockReset2FA = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useDeleteUser as Mock).mockReturnValue({ mutate: mockDeleteUser, isPending: false });
        (useResetTwoFactor as Mock).mockReturnValue({ mutate: mockReset2FA, isPending: false });
        (useAuth as Mock).mockReturnValue({
            user: { id: 99, roles: ["admin"], permissions: ["delete records"] }
        });
    });

    it("renders actions menu trigger", () => {
        render(<UserActions user={mockUser} />);
        expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("copies email to clipboard", async () => {
        const user = userEvent.setup();
        const writeTextSpy = vi.fn();
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: writeTextSpy },
            writable: true,
            configurable: true,
        });

        render(<UserActions user={mockUser} />);

        // Open menu
        await user.click(screen.getByRole("button"));

        // Use fireEvent for simple click handler execution to avoid userEvent clipboard complications
        const copyBtn = await screen.findByText("Copy Email");
        fireEvent.click(copyBtn);

        expect(writeTextSpy).toHaveBeenCalledWith(mockUser.email);
    });

    it("shows Reset 2FA only when enabled", async () => {
        const user = userEvent.setup();
        const userWith2FA = { ...mockUser, two_factor_enabled: true };
        render(<UserActions user={userWith2FA} />);

        await user.click(screen.getByRole("button"));
        expect(await screen.findByText("Reset 2FA")).toBeInTheDocument();
    });

    it("hides Reset 2FA when disabled", async () => {
        const user = userEvent.setup();
        render(<UserActions user={mockUser} />);

        await user.click(screen.getByRole("button"));

        await waitFor(() => {
            expect(screen.queryByText("Reset 2FA")).not.toBeInTheDocument();
        });
    });

    it("handles Reset 2FA confirmation", async () => {
        const user = userEvent.setup();
        (window.confirm as Mock).mockReturnValue(true);
        const userWith2FA = { ...mockUser, two_factor_enabled: true };
        render(<UserActions user={userWith2FA} />);

        await user.click(screen.getByRole("button"));
        const resetBtn = await screen.findByText("Reset 2FA");
        await user.click(resetBtn);

        expect(window.confirm).toHaveBeenCalled();
        expect(mockReset2FA).toHaveBeenCalledWith(userWith2FA.id);
    });

    it("shows Delete User if permission exists", async () => {
        const user = userEvent.setup();
        render(<UserActions user={mockUser} />);

        await user.click(screen.getByRole("button"));
        expect(await screen.findByText("Delete User")).toBeInTheDocument();
    });

    it("hides Delete User if permission missing", async () => {
        const user = userEvent.setup();
        (useAuth as Mock).mockReturnValue({
            user: { id: 99, roles: ["member"], permissions: [] } // No permissions
        });

        render(<UserActions user={mockUser} />);

        await user.click(screen.getByRole("button"));
        await waitFor(() => {
            expect(screen.queryByText("Delete User")).not.toBeInTheDocument();
        });
    });

    it("handles Delete User confirmation", async () => {
        const user = userEvent.setup();
        (window.confirm as Mock).mockReturnValue(true);
        render(<UserActions user={mockUser} />);

        await user.click(screen.getByRole("button"));
        const deleteBtn = await screen.findByText("Delete User");
        await user.click(deleteBtn);

        expect(window.confirm).toHaveBeenCalled();
        expect(mockDeleteUser).toHaveBeenCalledWith(mockUser.id);
    });

    // RBAC Tests for Change Role
    it("shows Change Role for Super Admin targeting Member", async () => {
        const user = userEvent.setup();
        (useAuth as Mock).mockReturnValue({
            user: { id: 99, roles: ["super-admin"] }
        });

        render(<UserActions user={mockUser} />); // target is member
        await user.click(screen.getByRole("button"));

        expect(await screen.findByText("Change Role")).toBeInTheDocument();
    });

    it("hides Change Role for Admin targeting Admin", async () => {
        const user = userEvent.setup();
        (useAuth as Mock).mockReturnValue({
            user: { id: 99, roles: ["admin"] }
        });
        const targetAdmin = { ...mockUser, roles: ["admin"] };

        render(<UserActions user={targetAdmin} />);
        await user.click(screen.getByRole("button"));

        await waitFor(() => {
            expect(screen.queryByText("Change Role")).not.toBeInTheDocument();
        });
    });

    it("hides Change Role for Admin targeting Super Admin", async () => {
        const user = userEvent.setup();
        (useAuth as Mock).mockReturnValue({
            user: { id: 99, roles: ["admin"] }
        });
        const targetSuperAdmin = { ...mockUser, roles: ["super-admin"] };

        render(<UserActions user={targetSuperAdmin} />);
        await user.click(screen.getByRole("button"));

        await waitFor(() => {
            expect(screen.queryByText("Change Role")).not.toBeInTheDocument();
        });
    });

    it("opens Change Role Dialog", async () => {
        const user = userEvent.setup();
        (useAuth as Mock).mockReturnValue({
            user: { id: 99, roles: ["super-admin"] }
        });

        render(<UserActions user={mockUser} />);
        await user.click(screen.getByRole("button"));

        const changeRoleBtn = await screen.findByText("Change Role");
        await user.click(changeRoleBtn);

        expect(await screen.findByTestId("change-role-dialog")).toBeInTheDocument();
    });
});
