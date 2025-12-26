import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn utility", () => {
    it("should merge class names", () => {
        expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("should handle conditional classes", () => {
        expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
    });

    it("should handle undefined and null values", () => {
        expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
    });

    it("should deduplicate conflicting Tailwind classes", () => {
        expect(cn("px-2", "px-4")).toBe("px-4");
    });

    it("should handle array inputs", () => {
        expect(cn(["foo", "bar"])).toBe("foo bar");
    });

    it("should handle object inputs", () => {
        expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
    });

    it("should handle empty inputs", () => {
        expect(cn()).toBe("");
    });

    it("should handle mixed inputs", () => {
        expect(cn("base", ["array-class"], { conditional: true })).toBe(
            "base array-class conditional"
        );
    });
});
