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
            total_duration_seconds: 174720,
            average_call_duration_seconds: 142,
        };

        vi.mocked(api.get).mockResolvedValueOnce(mockMetrics);

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
    });
});
