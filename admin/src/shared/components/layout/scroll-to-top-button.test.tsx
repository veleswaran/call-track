import { render, screen, fireEvent, act } from "@testing-library/react";
import { ScrollToTopButton } from "./scroll-to-top-button";
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("ScrollToTopButton", () => {
    beforeEach(() => {
        window.scrollTo = vi.fn();
        Object.defineProperty(window, "scrollY", {
            writable: true,
            configurable: true,
            value: 0,
        });
    });

    it("renders hidden initially when scroll is 0", () => {
        render(<ScrollToTopButton />);
        const button = screen.getByRole("button", { name: /scroll to top/i });
        expect(button).toHaveClass("opacity-0");
    });

    it("becomes visible on scroll past 300 and triggers scrollTo on click", () => {
        render(<ScrollToTopButton />);
        const button = screen.getByRole("button", { name: /scroll to top/i });

        act(() => {
            window.scrollY = 350;
            window.dispatchEvent(new Event("scroll"));
        });

        expect(button).toHaveClass("opacity-100");

        fireEvent.click(button);
        expect(window.scrollTo).toHaveBeenCalledWith({
            top: 0,
            behavior: "smooth",
        });
    });

    it("removes scroll event listener on unmount", () => {
        const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
        const { unmount } = render(<ScrollToTopButton />);
        unmount();
        expect(removeEventListenerSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
    });
});
