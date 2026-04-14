import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DashboardPage from "./page";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock hooks
vi.mock("@features/dashboard/hooks/use-dashboard", () => ({
    useDashboardMetrics: vi.fn(),
    useDashboardCharts: vi.fn(),
}));

// Mock components to simplify
vi.mock("@features/dashboard/components/CallVolumeTrendsChart", () => ({
    CallVolumeTrendsChart: () => <div data-testid="volume-chart">Volume Chart</div>,
}));
vi.mock("@features/dashboard/components/CallOutcomeChart", () => ({
    CallOutcomeChart: () => <div data-testid="outcome-chart">Outcome Chart</div>,
}));
vi.mock("@features/dashboard/components/DashboardFilters", () => ({
    DashboardFilters: ({ onFilterChange }: { onFilterChange: (filters: DashboardFiltersData) => void }) => (
        <button 
            data-testid="trigger-filter" 
            onClick={() => onFilterChange({ 
                dateRange: { 
                    from: new Date('2024-01-01'), 
                    to: new Date('2024-01-07') 
                } 
            })}
        >
            Filter Trigger
        </button>
    ),
}));

import { useDashboardMetrics, useDashboardCharts } from "@features/dashboard/hooks/use-dashboard";
import { DashboardFiltersData } from "@features/dashboard/components/DashboardFilters";

describe("DashboardPage", () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });
        vi.mocked(useDashboardMetrics).mockReturnValue({ data: {}, isLoading: false } as unknown as ReturnType<typeof useDashboardMetrics>);
        vi.mocked(useDashboardCharts).mockReturnValue({ data: {}, isLoading: false } as unknown as ReturnType<typeof useDashboardCharts>);
    });

    it("renders metric cards with query parameters preserving date range", async () => {
        const user = userEvent.setup();
        render(
            <QueryClientProvider client={queryClient}>
                <DashboardPage />
            </QueryClientProvider>
        );

        // Initially dates are today, trigger the filter
        const filterButton = screen.getByTestId("trigger-filter");
        await user.click(filterButton);

        // Wait for the link to update with the new dates
        await waitFor(() => {
            const totalCallsLink = screen.getByText("Total Calls").closest('a');
            expect(totalCallsLink?.getAttribute('href')).toContain("start_date=2024-01-01");
            expect(totalCallsLink?.getAttribute('href')).toContain("end_date=2024-01-07");
        });

        const missedCallsLink = screen.getByText("Missed Calls").closest('a');
        expect(missedCallsLink?.getAttribute('href')).toContain("start_date=2024-01-01");
        expect(missedCallsLink?.getAttribute('href')).toContain("end_date=2024-01-07");
    });

    it("shows loading skeletons when metrics are loading", () => {
        vi.mocked(useDashboardMetrics).mockReturnValue({ data: {}, isLoading: true } as unknown as ReturnType<typeof useDashboardMetrics>);

        render(
            <QueryClientProvider client={queryClient}>
                <DashboardPage />
            </QueryClientProvider>
        );

        // Check if loading skeletons are present
        const skeletons = document.querySelectorAll(".animate-pulse");
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it("hides comparison indicator when changePercent is missing", () => {
        vi.mocked(useDashboardMetrics).mockReturnValue({ 
            data: { total_calls: 100, total_calls_change_percent: null }, 
            isLoading: false 
        } as unknown as ReturnType<typeof useDashboardMetrics>);

        render(
            <QueryClientProvider client={queryClient}>
                <DashboardPage />
            </QueryClientProvider>
        );

        // Should not show "vs last week" text which is inside ComparisonIndicator
        expect(screen.queryByText(/vs last week/)).not.toBeInTheDocument();
    });
});
