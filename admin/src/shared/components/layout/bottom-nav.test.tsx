import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BottomNav, navItems } from "./bottom-nav";

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

    it("should render all navigation items", () => {
        render(<BottomNav />);

        navItems.forEach((item) => {
            expect(
                screen.getByTestId(`bottom-nav-${item.name.toLowerCase()}`)
            ).toBeInTheDocument();
        });
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

    it("should render correct link hrefs", () => {
        render(<BottomNav />);

        navItems.forEach((item) => {
            const link = screen.getByTestId(`bottom-nav-${item.name.toLowerCase()}`);
            expect(link).toHaveAttribute("href", item.href);
        });
    });

    it("should have md:hidden class for mobile-only display", () => {
        render(<BottomNav />);
        expect(screen.getByTestId("bottom-nav")).toHaveClass("md:hidden");
    });
});

describe("navItems", () => {
    it("should have 4 navigation items", () => {
        expect(navItems).toHaveLength(4);
    });

    it("should have Dashboard as first item", () => {
        expect(navItems[0].name).toBe("Dashboard");
        expect(navItems[0].href).toBe("/");
    });
});
