import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MobileMenu, menuItems } from "./mobile-menu";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
    usePathname: vi.fn(() => "/"),
}));

describe("MobileMenu", () => {
    const defaultProps = {
        open: true,
        onClose: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        document.body.style.overflow = "";
        // Suppress jsdom navigation warning
        vi.spyOn(console, "error").mockImplementation((msg) => {
            if (typeof msg === "string" && msg.includes("Not implemented: navigation")) {
                return;
            }
            console.warn(msg);
        });
    });

    it("should render menu when open", () => {
        render(<MobileMenu {...defaultProps} />);
        expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
    });

    it("should not render menu when closed", () => {
        render(<MobileMenu {...defaultProps} open={false} />);
        expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();
    });

    it("should render backdrop when open", () => {
        render(<MobileMenu {...defaultProps} />);
        expect(screen.getByTestId("mobile-menu-backdrop")).toBeInTheDocument();
    });

    it("should render all menu items", () => {
        render(<MobileMenu {...defaultProps} />);

        menuItems.forEach((item) => {
            expect(
                screen.getByTestId(`mobile-menu-${item.name.toLowerCase()}`)
            ).toBeInTheDocument();
        });
    });

    it("should call onClose when backdrop is clicked", async () => {
        const user = userEvent.setup();
        render(<MobileMenu {...defaultProps} />);

        await user.click(screen.getByTestId("mobile-menu-backdrop"));
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it("should call onClose when close button is clicked", async () => {
        const user = userEvent.setup();
        render(<MobileMenu {...defaultProps} />);

        await user.click(screen.getByTestId("mobile-menu-close"));
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it("should call onClose when Escape key is pressed", async () => {
        const user = userEvent.setup();
        render(<MobileMenu {...defaultProps} />);

        await user.keyboard("{Escape}");
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it("should render logout button when onLogout is provided", () => {
        render(<MobileMenu {...defaultProps} onLogout={() => { }} />);
        expect(screen.getByTestId("mobile-menu-logout")).toBeInTheDocument();
    });

    it("should not render logout button when onLogout is not provided", () => {
        render(<MobileMenu {...defaultProps} />);
        expect(screen.queryByTestId("mobile-menu-logout")).not.toBeInTheDocument();
    });

    it("should call onLogout and onClose when logout is clicked", async () => {
        const user = userEvent.setup();
        const onLogout = vi.fn();
        render(<MobileMenu {...defaultProps} onLogout={onLogout} />);

        await user.click(screen.getByTestId("mobile-menu-logout"));
        expect(onLogout).toHaveBeenCalledTimes(1);
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it("should call onClose when navigation link is clicked", async () => {
        const user = userEvent.setup();
        render(<MobileMenu {...defaultProps} />);

        await user.click(screen.getByTestId("mobile-menu-contacts"));
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it("should have dialog role", () => {
        render(<MobileMenu {...defaultProps} />);
        expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("should prevent body scroll when open", () => {
        render(<MobileMenu {...defaultProps} />);
        expect(document.body.style.overflow).toBe("hidden");
    });

    it("should restore body scroll when closed", () => {
        const { unmount } = render(<MobileMenu {...defaultProps} />);
        unmount();
        expect(document.body.style.overflow).toBe("");
    });
});

describe("menuItems", () => {
    it("should have 2 menu items", () => {
        expect(menuItems).toHaveLength(2);
    });

    it("should have Contacts as first item", () => {
        expect(menuItems[0].name).toBe("Contacts");
        expect(menuItems[0].href).toBe("/contacts");
    });
});
