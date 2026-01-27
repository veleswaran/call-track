import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "./app-shell";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
    usePathname: vi.fn(() => "/"),
}));

// Mock useMobile hook - default to desktop
vi.mock("@shared/hooks/use-mobile", () => ({
    useMobile: vi.fn(() => false),
}));

// Mock auth hook
vi.mock("@/src/features/auth/hooks/use-auth", () => ({
    useAuth: vi.fn(() => ({
        user: {
            name: "Test User",
            roles: [{ name: "admin" }]
        },
    })),
}));

import { useMobile } from "@shared/hooks/use-mobile";

describe("AppShell", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useMobile).mockReturnValue(false); // Default to desktop
    });

    it("should render app shell with children", () => {
        render(
            <AppShell>
                <div data-testid="child-content">Page content</div>
            </AppShell>
        );

        expect(screen.getByTestId("app-shell")).toBeInTheDocument();
        expect(screen.getByTestId("child-content")).toBeInTheDocument();
    });

    it("should render main content area", () => {
        render(<AppShell>Content</AppShell>);
        expect(screen.getByTestId("main-content")).toBeInTheDocument();
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

    describe("Desktop view", () => {
        beforeEach(() => {
            vi.mocked(useMobile).mockReturnValue(false);
        });

        it("should render sidebar on desktop", () => {
            render(<AppShell>Content</AppShell>);
            expect(screen.getByTestId("sidebar")).toBeInTheDocument();
        });

        it("should render header with menu toggle", () => {
            render(<AppShell>Content</AppShell>);
            expect(screen.getByTestId("menu-toggle")).toBeInTheDocument();
        });

        it("should toggle sidebar when sidebar toggle is clicked", async () => {
            const user = userEvent.setup();
            render(<AppShell>Content</AppShell>);

            const sidebar = screen.getByTestId("sidebar");
            expect(sidebar).toHaveClass("w-64");

            await user.click(screen.getByTestId("sidebar-toggle"));
            expect(sidebar).toHaveClass("w-16");

            await user.click(screen.getByTestId("sidebar-toggle"));
            expect(sidebar).toHaveClass("w-64");
        });

        it("should toggle sidebar when header menu button is clicked", async () => {
            const user = userEvent.setup();
            render(<AppShell>Content</AppShell>);

            const sidebar = screen.getByTestId("sidebar");
            expect(sidebar).toHaveClass("w-64");

            await user.click(screen.getByTestId("menu-toggle"));
            expect(sidebar).toHaveClass("w-16");
        });

        it("should pass user to header", async () => {
            const userEventSetup = userEvent.setup();
            const mockUser: any = {
                id: 1,
                name: "Test User",
                roles: [{ name: "admin" }]
            };
            render(<AppShell user={mockUser}>Content</AppShell>);

            await userEventSetup.click(screen.getByTestId("user-menu-button"));
            expect(screen.getByText(/Test User/)).toBeInTheDocument();
        });

        it("should pass onLogout to header on desktop", async () => {
            const user = userEvent.setup();
            const onLogout = vi.fn();
            render(<AppShell onLogout={onLogout}>Content</AppShell>);

            await user.click(screen.getByTestId("user-menu-button"));
            await user.click(screen.getByTestId("logout-button"));
            expect(onLogout).toHaveBeenCalledTimes(1);
        });

        it("should not render bottom nav on desktop", () => {
            render(<AppShell>Content</AppShell>);
            expect(screen.queryByTestId("bottom-nav")).not.toBeInTheDocument();
        });
    });

    describe("Mobile view", () => {
        beforeEach(() => {
            vi.mocked(useMobile).mockReturnValue(true);
        });

        it("should not render sidebar on mobile", () => {
            render(<AppShell>Content</AppShell>);
            expect(screen.queryByTestId("sidebar")).not.toBeInTheDocument();
        });

        it("should render bottom nav on mobile", () => {
            render(<AppShell>Content</AppShell>);
            expect(screen.getByTestId("bottom-nav")).toBeInTheDocument();
        });

        it("should open mobile menu when hamburger is clicked", async () => {
            const user = userEvent.setup();
            render(<AppShell>Content</AppShell>);

            expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();

            await user.click(screen.getByTestId("menu-toggle"));
            expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
        });

        it("should close mobile menu when close button is clicked", async () => {
            const user = userEvent.setup();
            render(<AppShell>Content</AppShell>);

            await user.click(screen.getByTestId("menu-toggle"));
            expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();

            await user.click(screen.getByTestId("mobile-menu-close"));
            expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();
        });

        it("should have logout in mobile menu", async () => {
            const user = userEvent.setup();
            const onLogout = vi.fn();
            render(<AppShell onLogout={onLogout}>Content</AppShell>);

            await user.click(screen.getByTestId("menu-toggle"));
            expect(screen.getByTestId("mobile-menu-logout")).toBeInTheDocument();
        });
    });
});
