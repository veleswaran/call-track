import { describe, it, expect } from "vitest";
import { getCallOutcome } from "./call";

describe("getCallOutcome", () => {
    it("returns Connected for any call with duration > 0", () => {
        expect(getCallOutcome("incoming", 10)).toBe("Connected");
        expect(getCallOutcome("outgoing", 5)).toBe("Connected");
        expect(getCallOutcome("missed", 100)).toBe("Connected");
    });

    it("returns Missed for missed/rejected/blocked direction with 0 duration", () => {
        expect(getCallOutcome("missed", 0)).toBe("Missed");
        expect(getCallOutcome("rejected", 0)).toBe("Missed");
        expect(getCallOutcome("blocked", 0)).toBe("Missed");
    });

    it("returns Missed for incoming with 0 duration", () => {
        expect(getCallOutcome("incoming", 0)).toBe("Missed");
    });

    it("returns No Answer for outgoing with 0 duration", () => {
        expect(getCallOutcome("outgoing", 0)).toBe("No Answer");
    });
});
