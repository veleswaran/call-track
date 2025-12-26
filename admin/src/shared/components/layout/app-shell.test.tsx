import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "./app-shell";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
    usePathname: vi.fn(() => "/"),
}));

describe("AppShell", () => {
    it("should render app shell with children", () => {
        render(
            <AppShell>
                <div data-testid="child-content">Page content</div>
            </AppShell>
        );

        expect(screen.getByTestId("app-shell")).toBeInTheDocument();
        expect(screen.getByTestId("child-content")).toBeInTheDocument();
    });

    it("should render sidebar", () => {
        render(<AppShell>Content</AppShell>);
        expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    });

    it("should render header with menu toggle", () => {
        render(<AppShell>Content</AppShell>);
        expect(screen.getByTestId("menu-toggle")).toBeInTheDocument();
    });

    it("should render main content area", () => {
        render(<AppShell>Content</AppShell>);
        expect(screen.getByTestId("main-content")).toBeInTheDocument();
    });

    it("should toggle sidebar when sidebar toggle is clicked", async () => {
        const user = userEvent.setup();
        render(<AppShell>Content</AppShell>);

        const sidebar = screen.getByTestId("sidebar");
        expect(sidebar).toHaveClass("w-64"); // Initially open

        await user.click(screen.getByTestId("sidebar-toggle"));
        expect(sidebar).toHaveClass("w-16"); // Now collapsed

        await user.click(screen.getByTestId("sidebar-toggle"));
        expect(sidebar).toHaveClass("w-64"); // Expanded again
    });

    it("should toggle sidebar when header menu button is clicked", async () => {
        const user = userEvent.setup();
        render(<AppShell>Content</AppShell>);

        const sidebar = screen.getByTestId("sidebar");
        expect(sidebar).toHaveClass("w-64");

        await user.click(screen.getByTestId("menu-toggle"));
        expect(sidebar).toHaveClass("w-16");
    });

    it("should pass userName to header", async () => {
        const user = userEvent.setup();
        render(<AppShell userName="Test User">Content</AppShell>);

        await user.click(screen.getByTestId("user-menu-button"));
        expect(screen.getByText("Test User")).toBeInTheDocument();
    });

    it("should pass onLogout to header", async () => {
        const user = userEvent.setup();
        const onLogout = vi.fn();
        render(<AppShell onLogout={onLogout}>Content</AppShell>);

        await user.click(screen.getByTestId("user-menu-button"));
        await user.click(screen.getByTestId("logout-button"));
        expect(onLogout).toHaveBeenCalledTimes(1);
    });

    it("should render children in main content area", () => {
        render(
            <AppShell>
                <h1>Dashboard</h1>
                <p>Welcome to the dashboard</p>
            </AppShell>
        );

        const mainContent = screen.getByTestId("main-content");
        expect(mainContent).toContainElement(
            screen.getByRole("heading", { name: "Dashboard" })
        );
        expect(mainContent).toContainElement(
            screen.getByText("Welcome to the dashboard")
        );
    });
});
