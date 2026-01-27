import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "./header";
import { User } from "../../types";

describe("Header", () => {
    it("should render header with menu toggle", () => {
        render(<Header onMenuClick={() => { }} />);
        expect(screen.getByTestId("menu-toggle")).toBeInTheDocument();
    });

    it("should call onMenuClick when menu button is clicked", async () => {
        const user = userEvent.setup();
        const onMenuClick = vi.fn();
        render(<Header onMenuClick={onMenuClick} />);

        await user.click(screen.getByTestId("menu-toggle"));
        expect(onMenuClick).toHaveBeenCalledTimes(1);
    });

    it("should render notifications button", () => {
        render(<Header onMenuClick={() => { }} />);
        expect(screen.getByTestId("notifications-button")).toBeInTheDocument();
    });

    it("should render user menu button", () => {
        render(<Header onMenuClick={() => { }} />);
        expect(screen.getByTestId("user-menu-button")).toBeInTheDocument();
    });

    it("should toggle user menu on click", async () => {
        const userEventSetup = userEvent.setup();
        const mockUser: User = {
            id: 1,
            name: "John Doe",
            email: "test@example.com",
            roles: [{ id: 1, name: "admin", created_at: "2026-01-27T16:54:01+05:30", updated_at: "2026-01-27T16:54:01+05:30" }],
            created_at: "2026-01-27T16:54:01+05:30",
            updated_at: "2026-01-27T16:54:01+05:30",
            email_verified_at: null
        };
        render(<Header onMenuClick={() => { }} user={mockUser} />);

        // Menu should be closed initially
        expect(screen.queryByTestId("user-menu-dropdown")).not.toBeInTheDocument();

        // Click to open
        await userEventSetup.click(screen.getByTestId("user-menu-button"));
        expect(screen.getByTestId("user-menu-dropdown")).toBeInTheDocument();

        // Click to close
        await userEventSetup.click(screen.getByTestId("user-menu-button"));
        expect(screen.queryByTestId("user-menu-dropdown")).not.toBeInTheDocument();
    });

    it("should display custom userName in dropdown", async () => {
        const userEventSetup = userEvent.setup();
        const mockUser: User = {
            id: 1,
            name: "John Doe",
            email: "test@example.com",
            roles: [{ id: 1, name: "admin", created_at: "2026-01-27T16:54:01+05:30", updated_at: "2026-01-27T16:54:01+05:30" }],
            created_at: "2026-01-27T16:54:01+05:30",
            updated_at: "2026-01-27T16:54:01+05:30",
            email_verified_at: null
        };
        render(<Header onMenuClick={() => { }} user={mockUser} />);

        await userEventSetup.click(screen.getByTestId("user-menu-button"));
        expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    });

    it("should render logout button when onLogout is provided", async () => {
        const user = userEvent.setup();
        render(<Header onMenuClick={() => { }} onLogout={() => { }} />);

        await user.click(screen.getByTestId("user-menu-button"));
        expect(screen.getByTestId("logout-button")).toBeInTheDocument();
    });

    it("should not render logout button when onLogout is not provided", async () => {
        const user = userEvent.setup();
        render(<Header onMenuClick={() => { }} />);

        await user.click(screen.getByTestId("user-menu-button"));
        expect(screen.queryByTestId("logout-button")).not.toBeInTheDocument();
    });

    it("should call onLogout when logout button is clicked", async () => {
        const user = userEvent.setup();
        const onLogout = vi.fn();
        render(<Header onMenuClick={() => { }} onLogout={onLogout} />);

        await user.click(screen.getByTestId("user-menu-button"));
        await user.click(screen.getByTestId("logout-button"));
        expect(onLogout).toHaveBeenCalledTimes(1);
    });

    it("should have correct aria-label for menu toggle", () => {
        render(<Header onMenuClick={() => { }} />);
        expect(screen.getByLabelText("Toggle menu")).toBeInTheDocument();
    });

    it("should have correct aria-label for notifications", () => {
        render(<Header onMenuClick={() => { }} />);
        expect(screen.getByLabelText("Notifications")).toBeInTheDocument();
    });

    it("should have correct aria-expanded attribute", async () => {
        const user = userEvent.setup();
        render(<Header onMenuClick={() => { }} />);

        const userMenuButton = screen.getByTestId("user-menu-button");
        expect(userMenuButton).toHaveAttribute("aria-expanded", "false");

        await user.click(userMenuButton);
        expect(userMenuButton).toHaveAttribute("aria-expanded", "true");
    });
});
