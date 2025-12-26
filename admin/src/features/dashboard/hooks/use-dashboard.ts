import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/api/api";
import type { DashboardMetrics } from "@shared/types";

/**
 * Query key for dashboard metrics
 */
export const dashboardKeys = {
    all: ["dashboard"] as const,
    metrics: () => [...dashboardKeys.all, "metrics"] as const,
};

/**
 * Hook to fetch dashboard metrics
 */
export function useDashboardMetrics() {
    return useQuery({
        queryKey: dashboardKeys.metrics(),
        queryFn: () => api.get<DashboardMetrics>("/api/v1/admin/dashboard"),
        // Dashboard should refresh in background
        staleTime: 30 * 1000, // 30 seconds
        refetchInterval: 60 * 1000, // Refetch every minute
    });
}
