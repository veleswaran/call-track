import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
    isDeviceStale,
    getHeartbeatStatus,
    formatLastSync,
} from "./device-utils";

describe("device-utils", () => {
    beforeEach(() => {
        // Mock Date.now to return a consistent time: 2026-01-19 12:00:00 UTC
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-01-19T12:00:00Z"));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("isDeviceStale", () => {
        it("returns true when lastSyncAt is null", () => {
            expect(isDeviceStale(null)).toBe(true);
        });

        it("returns true when lastSyncAt is over 1 hour ago", () => {
            // 2 hours ago
            const twoHoursAgo = "2026-01-19T10:00:00Z";
            expect(isDeviceStale(twoHoursAgo)).toBe(true);
        });

        it("returns false when lastSyncAt is within 1 hour", () => {
            // 30 minutes ago
            const thirtyMinutesAgo = "2026-01-19T11:30:00Z";
            expect(isDeviceStale(thirtyMinutesAgo)).toBe(false);
        });

        it("returns false when lastSyncAt is exactly 1 hour ago", () => {
            // Edge case: exactly 1 hour
            const oneHourAgo = "2026-01-19T11:00:00Z";
            expect(isDeviceStale(oneHourAgo)).toBe(false);
        });
    });

    describe("getHeartbeatStatus", () => {
        it('returns "stale" when lastSyncAt is null', () => {
            expect(getHeartbeatStatus(null)).toBe("stale");
        });

        it('returns "active" when lastSyncAt is within 30 minutes', () => {
            const tenMinutesAgo = "2026-01-19T11:50:00Z";
            expect(getHeartbeatStatus(tenMinutesAgo)).toBe("active");
        });

        it('returns "warning" when lastSyncAt is 30-60 minutes ago', () => {
            const fortyFiveMinutesAgo = "2026-01-19T11:15:00Z";
            expect(getHeartbeatStatus(fortyFiveMinutesAgo)).toBe("warning");
        });

        it('returns "stale" when lastSyncAt is over 60 minutes ago', () => {
            const twoHoursAgo = "2026-01-19T10:00:00Z";
            expect(getHeartbeatStatus(twoHoursAgo)).toBe("stale");
        });
    });

    describe("formatLastSync", () => {
        it('returns "Never" when lastSyncAt is null', () => {
            expect(formatLastSync(null)).toBe("Never");
        });

        it('returns "Just now" when lastSyncAt is less than 1 minute ago', () => {
            const justNow = "2026-01-19T11:59:30Z";
            expect(formatLastSync(justNow)).toBe("Just now");
        });

        it("returns minutes format when lastSyncAt is less than 1 hour ago", () => {
            const thirtyMinutesAgo = "2026-01-19T11:30:00Z";
            expect(formatLastSync(thirtyMinutesAgo)).toBe("30m ago");
        });

        it("returns hours format when lastSyncAt is less than 1 day ago", () => {
            const threeHoursAgo = "2026-01-19T09:00:00Z";
            expect(formatLastSync(threeHoursAgo)).toBe("3h ago");
        });

        it("returns days format when lastSyncAt is over 1 day ago", () => {
            const twoDaysAgo = "2026-01-17T12:00:00Z";
            expect(formatLastSync(twoDaysAgo)).toBe("2d ago");
        });
    });
});
