import { describe, it, expect } from "vitest";
import { formatDate } from "./date";

describe("formatDate", () => {
    it("formats valid date string", () => {
        expect(formatDate("2023-01-01T10:00:00")).toBe("Jan 01, 2023 10:00");
    });

    it("formats Date object", () => {
        expect(formatDate(new Date("2023-01-01T10:00:00"))).toBe("Jan 01, 2023 10:00");
    });

    it("returns N/A for null", () => {
        expect(formatDate(null)).toBe("N/A");
    });

    it("returns N/A for undefined", () => {
        expect(formatDate(undefined)).toBe("N/A");
    });

    it("accepts custom format string", () => {
        expect(formatDate("2023-01-01T10:00:00", "yyyy-MM-dd")).toBe("2023-01-01");
    });
});
