import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SidebarNav, defaultNavigation, type NavItem } from "./sidebar-nav";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
    usePathname: vi.fn(() => "/"),
}));

// Mock auth hook
vi.mock("@/src/features/auth/hooks/use-auth", () => ({
    useAuth: vi.fn(() => ({
        user: {
            roles: [{ name: "admin" }]
        },
    })),
}));

describe("SidebarNav", () => {
    it("should render sidebar when open", () => {
        render(<SidebarNav open={true} onToggle={() => { }} />);
        const sidebar = screen.getByTestId("sidebar");
        expect(sidebar).toBeInTheDocument();
        expect(sidebar).toHaveClass("w-64");
    });

    it("should render collapsed sidebar when closed", () => {
        render(<SidebarNav open={false} onToggle={() => { }} />);
        const sidebar = screen.getByTestId("sidebar");
        expect(sidebar).toHaveClass("w-16");
    });

    it("should display logo text when open", () => {
        render(<SidebarNav open={true} onToggle={() => { }} />);
        expect(screen.getByText("CallTrack AI")).toBeInTheDocument();
    });

    it("should hide logo text when closed", () => {
        render(<SidebarNav open={false} onToggle={() => { }} />);
        expect(screen.queryByText("CallTrack AI")).not.toBeInTheDocument();
    });

    it("should call onToggle when toggle button is clicked", async () => {
        const user = userEvent.setup();
        const onToggle = vi.fn();
        render(<SidebarNav open={true} onToggle={onToggle} />);

        await user.click(screen.getByTestId("sidebar-toggle"));
        expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it("should render all default navigation items", () => {
        render(<SidebarNav open={true} onToggle={() => { }} />);

        defaultNavigation.forEach((item) => {
            expect(screen.getByText(item.name)).toBeInTheDocument();
        });
    });

    it("should hide navigation text when closed", () => {
        render(<SidebarNav open={false} onToggle={() => { }} />);

        defaultNavigation.forEach((item) => {
            expect(screen.queryByText(item.name)).not.toBeInTheDocument();
        });
    });

    it("should render custom navigation items", () => {
        const customNav: NavItem[] = [
            { name: "Custom Page", href: "/custom", icon: defaultNavigation[0].icon },
        ];
        render(<SidebarNav open={true} onToggle={() => { }} navigation={customNav} />);

        expect(screen.getByText("Custom Page")).toBeInTheDocument();
    });

    it("should have correct aria-label for toggle button when open", () => {
        render(<SidebarNav open={true} onToggle={() => { }} />);
        expect(screen.getByLabelText("Collapse sidebar")).toBeInTheDocument();
    });

    it("should have correct aria-label for toggle button when closed", () => {
        render(<SidebarNav open={false} onToggle={() => { }} />);
        expect(screen.getByLabelText("Expand sidebar")).toBeInTheDocument();
    });

    it("should have navigation role", () => {
        render(<SidebarNav open={true} onToggle={() => { }} />);
        expect(screen.getByRole("navigation")).toBeInTheDocument();
    });

    it("should render navigation links with correct href", () => {
        render(<SidebarNav open={true} onToggle={() => { }} />);

        defaultNavigation.forEach((item) => {
            const link = screen.getByRole("link", { name: item.name });
            expect(link).toHaveAttribute("href", item.href);
        });
    });
});

describe("defaultNavigation", () => {
    it("should have Dashboard as first item", () => {
        expect(defaultNavigation[0].name).toBe("Dashboard");
        expect(defaultNavigation[0].href).toBe("/");
    });
});
