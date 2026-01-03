import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChangePasswordForm } from "./change-password-form";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the hook
const mockChangePassword = vi.fn();

vi.mock("../hooks/use-change-password", () => ({
    useChangePassword: () => ({
        mutate: mockChangePassword,
        isPending: false,
    }),
}));

describe("ChangePasswordForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders the form correctly", () => {
        render(<ChangePasswordForm />);
        expect(screen.getByLabelText(/Current Password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Update Password/i })).toBeInTheDocument();
    });

    it("validates password matching", async () => {
        render(<ChangePasswordForm />);
        const user = userEvent.setup();

        await user.type(screen.getByLabelText(/New Password/i), "password123");
        await user.type(screen.getByLabelText(/Confirm Password/i), "password456");
        await user.click(screen.getByRole("button", { name: /Update Password/i }));

        await waitFor(() => {
            expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
        });
    });

    it("calls mutation with correct data on valid submission", async () => {
        render(<ChangePasswordForm />);
        const user = userEvent.setup();

        await user.type(screen.getByLabelText(/Current Password/i), "old-password");
        await user.type(screen.getByLabelText(/New Password/i), "new-password");
        await user.type(screen.getByLabelText(/Confirm Password/i), "new-password");
        await user.click(screen.getByRole("button", { name: /Update Password/i }));

        await waitFor(() => {
            expect(mockChangePassword).toHaveBeenCalledWith(
                {
                    current_password: "old-password",
                    password: "new-password",
                    password_confirmation: "new-password",
                },
                expect.any(Object)
            );
        });
    });
});
