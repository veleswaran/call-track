import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "./use-debounce";
import { describe, it, expect, vi } from "vitest";

describe("useDebounce", () => {
    it("returns initial value immediately", () => {
        const { result } = renderHook(() => useDebounce("initial", 500));
        expect(result.current).toBe("initial");
    });

    it("debounces value updates", async () => {
        vi.useFakeTimers();
        const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
            initialProps: { value: "initial" },
        });

        rerender({ value: "updated" });
        // Value shouldn't change yet
        expect(result.current).toBe("initial");

        // Fast forward time
        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(result.current).toBe("updated");
        vi.useRealTimers();
    });
});
