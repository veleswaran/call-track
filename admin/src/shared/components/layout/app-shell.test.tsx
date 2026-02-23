import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppShell } from "./app-shell";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
    usePathname: vi.fn(() => "/"),
}));

// Mock useAuth hook
vi.mock("@features/auth/hooks/use-auth", () => ({
    useAuth: vi.fn(() => ({
        user: {
            id: 1,
            name: "Test User",
            email: "test@example.com",
            email_verified_at: null,
            roles: ["admin"],
            permissions: ["manage devices", "manage users", "manage team"],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        isLoading: false,
        logout: vi.fn(),
    })),
}));

// Mock useMobile hook - default to desktop
vi.mock("@shared/hooks/use-mobile", () => ({
    useMobile: vi.fn(() => false),
}));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

const renderWithProviders = (ui: React.ReactElement) => {
    return render(ui, { wrapper });
};

import { useMobile } from "@shared/hooks/use-mobile";

const mockUser = {
    id: 1,
    name: "Test User",
    email: "test@example.com",
    email_verified_at: null,
    roles: ["admin"],
    permissions: ["manage devices", "manage users", "manage team"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
};

describe("AppShell", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useMobile).mockReturnValue(false); // Default to desktop
    });

    it("should render app shell with children", () => {
        renderWithProviders(
            <AppShell>
                <div data-testid="child-content">Page content</div>
            </AppShell>
        );

        expect(screen.getByTestId("app-shell")).toBeInTheDocument();
        expect(screen.getByTestId("child-content")).toBeInTheDocument();
    });

    it("should render main content area", () => {
        renderWithProviders(<AppShell>Content</AppShell>);
        expect(screen.getByTestId("main-content")).toBeInTheDocument();
    });

    it("should render children in main content area", () => {
        renderWithProviders(
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
            renderWithProviders(<AppShell>Content</AppShell>);
            expect(screen.getByTestId("sidebar")).toBeInTheDocument();
        });

        it("should render header with menu toggle", () => {
            renderWithProviders(<AppShell>Content</AppShell>);
            expect(screen.getByTestId("menu-toggle")).toBeInTheDocument();
        });

        it("should toggle sidebar when sidebar toggle is clicked", async () => {
            const user = userEvent.setup();
            renderWithProviders(<AppShell>Content</AppShell>);

            const sidebar = screen.getByTestId("sidebar");
            expect(sidebar).toHaveClass("w-64");

            await user.click(screen.getByTestId("sidebar-toggle"));
            expect(sidebar).toHaveClass("w-16");

            await user.click(screen.getByTestId("sidebar-toggle"));
            expect(sidebar).toHaveClass("w-64");
        });

        it("should toggle sidebar when header menu button is clicked", async () => {
            const user = userEvent.setup();
            renderWithProviders(<AppShell>Content</AppShell>);

            const sidebar = screen.getByTestId("sidebar");
            expect(sidebar).toHaveClass("w-64");

            await user.click(screen.getByTestId("menu-toggle"));
            expect(sidebar).toHaveClass("w-16");
        });

        it("should pass user to header", async () => {
            const user = userEvent.setup();
            renderWithProviders(<AppShell user={mockUser}>Content</AppShell>);

            await user.click(screen.getByTestId("user-menu-button"));
            expect(screen.getByText(/Test User/)).toBeInTheDocument();
        });

        it("should pass onLogout to header on desktop", async () => {
            const user = userEvent.setup();
            const onLogout = vi.fn();
            renderWithProviders(<AppShell onLogout={onLogout}>Content</AppShell>);

            await user.click(screen.getByTestId("user-menu-button"));
            await user.click(screen.getByTestId("logout-button"));
            expect(onLogout).toHaveBeenCalledTimes(1);
        });

        it("should not render bottom nav on desktop", () => {
            renderWithProviders(<AppShell>Content</AppShell>);
            expect(screen.queryByTestId("bottom-nav")).not.toBeInTheDocument();
        });
    });

    describe("Mobile view", () => {
        beforeEach(() => {
            vi.mocked(useMobile).mockReturnValue(true);
        });

        it("should not render sidebar on mobile", () => {
            renderWithProviders(<AppShell>Content</AppShell>);
            expect(screen.queryByTestId("sidebar")).not.toBeInTheDocument();
        });

        it("should render bottom nav on mobile", () => {
            renderWithProviders(<AppShell>Content</AppShell>);
            expect(screen.getByTestId("bottom-nav")).toBeInTheDocument();
        });

        it("should render More button in bottom nav on mobile", () => {
            renderWithProviders(<AppShell>Content</AppShell>);
            expect(screen.getByTestId("bottom-nav-more")).toBeInTheDocument();
        });

        it("should show overflow items when More button is clicked", async () => {
            const user = userEvent.setup();
            renderWithProviders(<AppShell>Content</AppShell>);

            await user.click(screen.getByTestId("bottom-nav-more"));
            expect(screen.getByText("Teams")).toBeInTheDocument();
            expect(screen.getByText("Users")).toBeInTheDocument();
            expect(screen.getByText("Agents")).toBeInTheDocument();
            expect(screen.getByText("Contacts")).toBeInTheDocument();
        });

        it("should have logout in bottom nav More menu", async () => {
            const user = userEvent.setup();
            const onLogout = vi.fn();
            renderWithProviders(<AppShell onLogout={onLogout}>Content</AppShell>);

            await user.click(screen.getByTestId("bottom-nav-more"));
            expect(screen.getByTestId("bottom-nav-logout")).toBeInTheDocument();
        });
    });
});
