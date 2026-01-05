import { describe, it, expect } from "vitest";
import { getCallStatus } from "./call";

describe("getCallStatus", () => {
    it("returns Missed for missed call type", () => {
        expect(getCallStatus("missed", 0)).toBe("Missed");
        expect(getCallStatus("missed", 100)).toBe("Missed"); // even if duration > 0 ?
    });

    it("returns Connected for duration > 0", () => {
        expect(getCallStatus("incoming", 10)).toBe("Connected");
        expect(getCallStatus("outgoing", 5)).toBe("Connected");
    });

    it("returns No Answer for duration 0", () => {
        expect(getCallStatus("incoming", 0)).toBe("No Answer");
        expect(getCallStatus("outgoing", 0)).toBe("No Answer");
    });
});
