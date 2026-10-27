import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BottomNav, navItems } from "./bottom-nav";

// Mock Auth
vi.mock("@/src/features/auth/hooks/use-auth", () => ({
    useAuth: vi.fn(() => ({
        user: {
            roles: ["admin"],
            permissions: ["manage devices", "manage team", "manage users"]
        }
    }))
}));

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
    usePathname: vi.fn(() => "/"),
}));

import { usePathname } from "next/navigation";

describe("BottomNav", () => {
    beforeEach(() => {
        vi.mocked(usePathname).mockReturnValue("/");
    });

    it("should render bottom navigation", () => {
        render(<BottomNav />);
        expect(screen.getByTestId("bottom-nav")).toBeInTheDocument();
    });

    it("should render primary navigation items", () => {
        render(<BottomNav />);

        expect(screen.getByTestId("bottom-nav-dashboard")).toBeInTheDocument();
        expect(screen.getByTestId("bottom-nav-reports")).toBeInTheDocument();
        expect(screen.getByTestId("bottom-nav-calls")).toBeInTheDocument();
        expect(screen.getByTestId("bottom-nav-devices")).toBeInTheDocument();
    });

    it("should render More button", () => {
        render(<BottomNav />);
        expect(screen.getByTestId("bottom-nav-more")).toBeInTheDocument();
    });

    it("should have navigation role", () => {
        render(<BottomNav />);
        expect(screen.getByRole("navigation")).toBeInTheDocument();
    });

    it("should have aria-label", () => {
        render(<BottomNav />);
        expect(
            screen.getByRole("navigation", { name: "Primary navigation" })
        ).toBeInTheDocument();
    });

    it("should highlight active link for dashboard", () => {
        vi.mocked(usePathname).mockReturnValue("/");
        render(<BottomNav />);

        const dashboardLink = screen.getByTestId("bottom-nav-dashboard");
        expect(dashboardLink).toHaveAttribute("aria-current", "page");
    });

    it("should highlight active link for call-logs", () => {
        vi.mocked(usePathname).mockReturnValue("/call-logs");
        render(<BottomNav />);

        const callsLink = screen.getByTestId("bottom-nav-calls");
        expect(callsLink).toHaveAttribute("aria-current", "page");
    });

    it("should highlight active link for nested paths", () => {
        vi.mocked(usePathname).mockReturnValue("/devices/123");
        render(<BottomNav />);

        const devicesLink = screen.getByTestId("bottom-nav-devices");
        expect(devicesLink).toHaveAttribute("aria-current", "page");
    });

    it("should not highlight inactive links", () => {
        vi.mocked(usePathname).mockReturnValue("/");
        render(<BottomNav />);

        const callsLink = screen.getByTestId("bottom-nav-calls");
        expect(callsLink).not.toHaveAttribute("aria-current");
    });

    it("should render correct link hrefs for primary items", () => {
        render(<BottomNav />);

        expect(screen.getByTestId("bottom-nav-dashboard")).toHaveAttribute("href", "/");
        expect(screen.getByTestId("bottom-nav-reports")).toHaveAttribute("href", "/reports");
        expect(screen.getByTestId("bottom-nav-calls")).toHaveAttribute("href", "/call-logs");
        expect(screen.getByTestId("bottom-nav-devices")).toHaveAttribute("href", "/devices");
    });

    it("should have md:hidden class for mobile-only display", () => {
        render(<BottomNav />);
        expect(screen.getByTestId("bottom-nav")).toHaveClass("md:hidden");
    });

    it("should open More menu when More button is clicked", async () => {
        const user = userEvent.setup();
        render(<BottomNav />);

        await user.click(screen.getByTestId("bottom-nav-more"));

        // More menu items should now be visible
        expect(screen.getByText("Teams")).toBeInTheDocument();
        expect(screen.getByText("Users")).toBeInTheDocument();
        expect(screen.getByText("Agents")).toBeInTheDocument();
        expect(screen.getByText("Contacts")).toBeInTheDocument();
        expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    it("should render logout button in More menu when onLogout is provided", async () => {
        const user = userEvent.setup();
        render(<BottomNav onLogout={() => { }} />);

        await user.click(screen.getByTestId("bottom-nav-more"));
        expect(screen.getByTestId("bottom-nav-logout")).toBeInTheDocument();
    });

    it("should not render logout button when onLogout is not provided", async () => {
        const user = userEvent.setup();
        render(<BottomNav />);

        await user.click(screen.getByTestId("bottom-nav-more"));
        expect(screen.queryByTestId("bottom-nav-logout")).not.toBeInTheDocument();
    });

    it("should close More menu when close button, overlay, or item is clicked", async () => {
        const user = userEvent.setup();
        const { container } = render(<BottomNav />);

        // Open menu
        await user.click(screen.getByTestId("bottom-nav-more"));
        expect(screen.getByText("Teams")).toBeInTheDocument();

        // Close via close button
        await user.click(screen.getByLabelText("Close menu"));
        expect(screen.queryByText("Teams")).not.toBeInTheDocument();

        // Open again
        await user.click(screen.getByTestId("bottom-nav-more"));
        expect(screen.getByText("Teams")).toBeInTheDocument();

        // Close via backdrop overlay
        const overlay = container.querySelector(".fixed.inset-0");
        if (overlay) {
            await user.click(overlay);
        }
        expect(screen.queryByText("Teams")).not.toBeInTheDocument();

        // Open and close via clicking a More item
        await user.click(screen.getByTestId("bottom-nav-more"));
        await user.click(screen.getByText("Teams"));
        expect(screen.queryByText("Teams")).not.toBeInTheDocument();

        // Open and close via clicking a primary nav item
        await user.click(screen.getByTestId("bottom-nav-more"));
        await user.click(screen.getByTestId("bottom-nav-dashboard"));
        expect(screen.queryByText("Teams")).not.toBeInTheDocument();
    });
});

describe("navItems", () => {
    it("should have 12 navigation items (4 primary + 8 overflow)", () => {
        expect(navItems).toHaveLength(12);
    });


    it("should have Dashboard as first item", () => {
        expect(navItems[0].name).toBe("Dashboard");
        expect(navItems[0].href).toBe("/");
    });
});
