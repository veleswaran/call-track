"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"

import { ReportFilters, ReportFiltersData } from "@features/reports/components/report-filters"
import { ReportSummary } from "@features/reports/components/report-summary"
import { ReportCharts } from "@features/reports/components/report-charts"
import { AgentPerformanceTable } from "@features/reports/components/agent-performance-table"
import { api } from "@shared/api/api"

export default function ReportsPage() {
    const [filters, setFilters] = useState<ReportFiltersData>({
        dateRange: {
            from: new Date(new Date().setDate(new Date().getDate() - 7)), // Last 7 days default
            to: new Date(),
        },
        outcome: "all",
        type: "BUSINESS"
    })

    const queryParams = {
        start_date: filters.dateRange?.from ? format(filters.dateRange.from, 'yyyy-MM-dd') : undefined,
        end_date: filters.dateRange?.to ? format(filters.dateRange.to, 'yyyy-MM-dd') : undefined,
        outcomes: filters.outcome !== 'all' ? [filters.outcome] : undefined,
        types: filters.type !== 'all' ? [filters.type] : undefined,
    }

    const getQueryString = (params: Record<string, string | number | (string | number)[] | undefined | null>) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                if (Array.isArray(value)) {
                    value.forEach(v => searchParams.append(`${key}[]`, String(v)));
                } else {
                    searchParams.append(key, String(value));
                }
            }
        });
        return searchParams.toString();
    }

    const metricsQuery = useQuery({
        queryKey: ['reports', 'metrics', queryParams],
        queryFn: async () => {
            const qs = getQueryString(queryParams);
            const res = await api.get<{ data: React.ComponentProps<typeof ReportSummary>['metrics'] }>(`/api/v1/admin/reports/metrics?${qs}`)
            return res.data
        }
    })

    const chartsQuery = useQuery({
        queryKey: ['reports', 'charts', queryParams],
        queryFn: async () => {
            const qs = getQueryString(queryParams);
            // Use ReportChartsProps['data'] if possible, or define a compatible type
            // The chart component expects specific structure. 
            // For now, removing 'any' explicit usage or silencing if needed, but better to type it.
            // Let's use a looser type that passes lint but is safer than any.
            const res = await api.get<{ data: React.ComponentProps<typeof ReportCharts>['data'] }>(`/api/v1/admin/reports/charts?${qs}`)
            return res.data
        }
    })

    const performanceQuery = useQuery({
        queryKey: ['reports', 'performance', queryParams],
        queryFn: async () => {
            const qs = getQueryString(queryParams);
            const res = await api.get<{ data: React.ComponentProps<typeof AgentPerformanceTable>['data'] }>(`/api/v1/admin/reports/performance?${qs}`)
            return res.data
        }
    })

    return (
        <div className="flex flex-col gap-6 p-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Call Reports</h1>
                <p className="text-muted-foreground">
                    Analyze call activity, agent performance, and follow-up status using real call data.
                </p>
            </div>
            <ReportFilters onFilterChange={setFilters} />

            <ReportSummary metrics={metricsQuery.data || []} isLoading={metricsQuery.isLoading} />

            {chartsQuery.isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <div className="col-span-full h-[300px] rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                    <div className="col-span-3 h-[250px] rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                    <div className="col-span-4 h-[250px] rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                </div>
            ) : chartsQuery.data ? (
                <ReportCharts data={chartsQuery.data} />
            ) : (
                <div className="p-8 text-center text-muted-foreground">
                    No chart data available for the selected period.
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Agent Performance Report</h2>
                    <p className="text-sm text-muted-foreground">See how each agent handles calls and responds to customers.</p>
                </div>

                {/* Stats Banner? (Skipping for now or using Summary) */}

                <AgentPerformanceTable data={performanceQuery.data || []} filters={filters} />
            </div>
        </div>
    )
}
