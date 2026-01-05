import { describe, it, expect } from "vitest";
import { formatDuration } from "./time";

describe("formatDuration", () => {
    it("returns '-' for 0 or negative", () => {
        expect(formatDuration(0)).toBe("-");
        expect(formatDuration(-5)).toBe("-");
    });

    it("formats seconds only", () => {
        expect(formatDuration(45)).toBe("45s");
    });

    it("formats minutes and seconds", () => {
        expect(formatDuration(65)).toBe("1m 5s");
        expect(formatDuration(60)).toBe("1m");
    });

    it("formats hours, minutes, and seconds", () => {
        expect(formatDuration(3665)).toBe("1h 1m 5s");
        expect(formatDuration(3600)).toBe("1h");
    });

    it("handles undefined/null gracefully (implicit typing)", () => {
        // @ts-expect-error - Testing graceful handling of invalid input
        expect(formatDuration(undefined)).toBe("-");
    });
});
