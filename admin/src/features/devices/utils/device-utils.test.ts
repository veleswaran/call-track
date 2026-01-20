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

        it("returns true when lastSyncAt is over 8 hours ago", () => {
            // 10 hours ago
            const tenHoursAgo = "2026-01-19T02:00:00Z";
            expect(isDeviceStale(tenHoursAgo)).toBe(true);
        });

        it("returns false when lastSyncAt is within 8 hours", () => {
            // 2 hours ago
            const twoHoursAgo = "2026-01-19T10:00:00Z";
            expect(isDeviceStale(twoHoursAgo)).toBe(false);
        });

        it("returns false when lastSyncAt is exactly 8 hours ago", () => {
            // Edge case: exactly 8 hours
            const eightHoursAgo = "2026-01-19T04:00:00Z";
            expect(isDeviceStale(eightHoursAgo)).toBe(false);
        });
    });

    describe("getHeartbeatStatus", () => {
        it('returns "stale" when lastSyncAt is null', () => {
            expect(getHeartbeatStatus(null)).toBe("stale");
        });

        it('returns "active" when lastSyncAt is within 60 minutes', () => {
            const thirtyMinutesAgo = "2026-01-19T11:30:00Z";
            expect(getHeartbeatStatus(thirtyMinutesAgo)).toBe("active");
        });

        it('returns "warning" when lastSyncAt is 60-180 minutes ago', () => {
            // 90 minutes ago
            const ninetyMinutesAgo = "2026-01-19T10:30:00Z";
            expect(getHeartbeatStatus(ninetyMinutesAgo)).toBe("warning");
        });

        it('returns "stale" when lastSyncAt is over 180 minutes ago', () => {
            // 4 hours ago (240 minutes)
            const fourHoursAgo = "2026-01-19T08:00:00Z";
            expect(getHeartbeatStatus(fourHoursAgo)).toBe("stale");
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
