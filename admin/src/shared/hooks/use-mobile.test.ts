import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMobile, MOBILE_BREAKPOINT } from "./use-mobile";

describe("useMobile", () => {
    const originalInnerWidth = window.innerWidth;

    const setWindowWidth = (width: number) => {
        Object.defineProperty(window, "innerWidth", {
            writable: true,
            configurable: true,
            value: width,
        });
    };

    beforeEach(() => {
        setWindowWidth(originalInnerWidth);
    });

    afterEach(() => {
        setWindowWidth(originalInnerWidth);
    });

    it("should return true when viewport is below mobile breakpoint", () => {
        setWindowWidth(375);
        const { result } = renderHook(() => useMobile());
        expect(result.current).toBe(true);
    });

    it("should return false when viewport is at or above mobile breakpoint", () => {
        setWindowWidth(768);
        const { result } = renderHook(() => useMobile());
        expect(result.current).toBe(false);
    });

    it("should return false for desktop viewport", () => {
        setWindowWidth(1024);
        const { result } = renderHook(() => useMobile());
        expect(result.current).toBe(false);
    });

    it("should update when window is resized", () => {
        setWindowWidth(1024);
        const { result } = renderHook(() => useMobile());
        expect(result.current).toBe(false);

        act(() => {
            setWindowWidth(375);
            window.dispatchEvent(new Event("resize"));
        });

        expect(result.current).toBe(true);
    });

    it("should clean up event listener on unmount", () => {
        const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
        const { unmount } = renderHook(() => useMobile());

        unmount();

        expect(removeEventListenerSpy).toHaveBeenCalledWith(
            "resize",
            expect.any(Function)
        );
        removeEventListenerSpy.mockRestore();
    });

    it("should export MOBILE_BREAKPOINT constant", () => {
        expect(MOBILE_BREAKPOINT).toBe(768);
    });
});
