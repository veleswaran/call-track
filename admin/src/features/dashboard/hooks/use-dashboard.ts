import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/api/api";
import type { DashboardMetrics } from "@shared/types";

/**
 * Query key for dashboard metrics
 */
export const dashboardKeys = {
    all: ["dashboard"] as const,
    metrics: (filters?: Record<string, string>) => {
        const key = [...dashboardKeys.all, "metrics"];
        return filters ? [...key, filters] : key;
    },
    charts: (filters?: Record<string, string>) => {
        const key = [...dashboardKeys.all, "charts"];
        return filters ? [...key, filters] : key;
    },
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
export function useDashboardMetrics(startDate?: string, endDate?: string) {
    const filters = { start_date: startDate, end_date: endDate };
    const hasFilters = !!(startDate || endDate);
    return useQuery({
        queryKey: hasFilters ? dashboardKeys.metrics(filters as Record<string, string>) : dashboardKeys.metrics(),
        queryFn: async () => {
            const params = new URLSearchParams();
            if (startDate) params.append("start_date", startDate);
            if (endDate) params.append("end_date", endDate);

            const qs = params.toString();
            const response = await api.get<{ data: DashboardMetrics }>(
                `/api/v1/admin/dashboard${qs ? `?${qs}` : ""}`
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
export function useDashboardCharts(startDate?: string, endDate?: string) {
    const filters = { start_date: startDate, end_date: endDate };
    const hasFilters = !!(startDate || endDate);
    return useQuery({
        queryKey: hasFilters ? dashboardKeys.charts(filters as Record<string, string>) : dashboardKeys.charts(),
        queryFn: async () => {
            const params = new URLSearchParams();
            if (startDate) params.append("start_date", startDate);
            if (endDate) params.append("end_date", endDate);

            const qs = params.toString();
            const response = await api.get<{ data: DashboardChartsData }>(
                `/api/v1/admin/dashboard/charts${qs ? `?${qs}` : ""}`
            );
            return response.data;
        },
        staleTime: 30 * 1000,
        refetchInterval: 60 * 1000,
    });
}
