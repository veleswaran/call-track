import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/api/api";
import type { DashboardMetrics } from "@shared/types";

/**
 * Query key for dashboard metrics
 */
export const dashboardKeys = {
    all: ["dashboard"] as const,
    metrics: () => [...dashboardKeys.all, "metrics"] as const,
    charts: () => [...dashboardKeys.all, "charts"] as const,
};

/**
 * Volume trend data for bar chart
 */
export interface VolumeTrendData {
    day: string;
    current: number;
    previous: number;
}

/**
 * Outcome distribution data for pie chart
 */
export interface OutcomeData {
    name: string;
    value: number;
}

/**
 * Dashboard charts API response
 */
export interface DashboardChartsData {
    volume_trends: VolumeTrendData[];
    outcome_distribution: OutcomeData[];
}

/**
 * Hook to fetch dashboard metrics
 */
export function useDashboardMetrics() {
    return useQuery({
        queryKey: dashboardKeys.metrics(),
        queryFn: async () => {
            const response = await api.get<{ data: DashboardMetrics }>(
                "/api/v1/admin/dashboard"
            );
            return response.data;
        },
        // Dashboard should refresh in background
        staleTime: 30 * 1000, // 30 seconds
        refetchInterval: 60 * 1000, // Refetch every minute
    });
}

/**
 * Hook to fetch dashboard chart data
 */
export function useDashboardCharts() {
    return useQuery({
        queryKey: dashboardKeys.charts(),
        queryFn: async () => {
            const response = await api.get<{ data: DashboardChartsData }>(
                "/api/v1/admin/dashboard/charts"
            );
            return response.data;
        },
        staleTime: 30 * 1000,
        refetchInterval: 60 * 1000,
    });
}
