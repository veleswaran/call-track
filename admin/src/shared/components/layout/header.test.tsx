import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "./header";
import { User } from "../../types";

const mockUser: User = {
    id: 1,
    name: "Test User",
    email: "test@example.com",
    email_verified_at: null,
    roles: ["admin"],
    permissions: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    two_factor_enabled: false,
};

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
        const user = userEvent.setup();
        render(<Header onMenuClick={() => { }} user={mockUser} />);

        // Menu should be closed initially
        expect(screen.queryByTestId("user-menu-dropdown")).not.toBeInTheDocument();

        // Click to open
        await user.click(screen.getByTestId("user-menu-button"));
        expect(screen.getByTestId("user-menu-dropdown")).toBeInTheDocument();

        // Click to close
        await user.click(screen.getByTestId("user-menu-button"));
        expect(screen.queryByTestId("user-menu-dropdown")).not.toBeInTheDocument();
    });

    it("should display user name in dropdown", async () => {
        const user = userEvent.setup();
        const customUser: User = { ...mockUser, name: "John Doe" };
        render(<Header onMenuClick={() => { }} user={customUser} />);

        await user.click(screen.getByTestId("user-menu-button"));
        expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    });

    it("should display nothing for user when not provided", async () => {
        const user = userEvent.setup();
        render(<Header onMenuClick={() => { }} />);

        await user.click(screen.getByTestId("user-menu-button"));
        // When no user is provided, the name part is empty
        const dropdown = screen.getByTestId("user-menu-dropdown");
        expect(dropdown).toBeInTheDocument();
    });

    it("should render logout button when onLogout is provided", async () => {
        const user = userEvent.setup();
        render(<Header onMenuClick={() => { }} onLogout={() => { }} user={mockUser} />);

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
        render(<Header onMenuClick={() => { }} onLogout={onLogout} user={mockUser} />);

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
