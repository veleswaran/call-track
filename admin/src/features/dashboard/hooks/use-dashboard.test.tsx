import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useDashboardMetrics, dashboardKeys } from "./use-dashboard";
import { api } from "@shared/api/api";
import type { DashboardMetrics } from "@shared/types";

// Mock the api module
vi.mock("@shared/api/api", () => ({
    api: {
        get: vi.fn(),
    },
}));

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    wrapper.displayName = "QueryClientWrapper";
    return wrapper;
}

describe("useDashboardMetrics", () => {
    it("should fetch dashboard metrics", async () => {
        const mockMetrics: DashboardMetrics = {
            total_calls: 1234,
            business_calls: 892,
            personal_calls: 245,
            ignored_calls: 97,
            unclassified_calls: 50,
            missed_calls: 15,
            total_missed_calls: 20,
            total_devices: 10,
            active_devices: 8,
            total_agents: 5,
            total_duration_seconds: 174720,
            average_call_duration_seconds: 142,
            total_calls_change_percent: 12.5,
            active_devices_change_percent: 5.0,
            missed_calls_change_percent: -5.0,
            average_call_duration_change_percent: -2.1,
            total_duration_change_percent: 10.0,
            pending_escalations:4,
            unattended_escalations:2,
            resolved_escalations:1
        };

        vi.mocked(api.get).mockResolvedValueOnce({ data: mockMetrics });

        const { result } = renderHook(() => useDashboardMetrics(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(api.get).toHaveBeenCalledWith("/api/v1/admin/dashboard");
        expect(result.current.data).toEqual(mockMetrics);
    });

    it("should handle error", async () => {
        vi.mocked(api.get).mockRejectedValueOnce(new Error("Network error"));

        const { result } = renderHook(() => useDashboardMetrics(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(result.current.error?.message).toBe("Network error");
    });
});

describe("dashboardKeys", () => {
    it("should have correct key structure", () => {
        expect(dashboardKeys.all).toEqual(["dashboard"]);
        expect(dashboardKeys.metrics()).toEqual(["dashboard", "metrics"]);
        expect(dashboardKeys.charts()).toEqual(["dashboard", "charts"]);
    });
});

describe("useDashboardCharts", () => {
    it("should fetch dashboard charts", async () => {
        const { useDashboardCharts } = await import("./use-dashboard");
        const mockCharts = {
            volume_trends: [{ day: "Mon", current: 10, previous: 5 }],
            outcome_distribution: [{ name: "Connected", value: 50 }],
        };

        vi.mocked(api.get).mockResolvedValueOnce({ data: mockCharts });

        const { result } = renderHook(() => useDashboardCharts(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(api.get).toHaveBeenCalledWith("/api/v1/admin/dashboard/charts");
        expect(result.current.data).toEqual(mockCharts);
    });
});
