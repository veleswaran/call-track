"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"

import { ReportFilters, ReportFiltersData } from "@features/reports/components/report-filters"
import { ReportSummary } from "@features/reports/components/report-summary"
import { ReportCharts } from "@features/reports/components/report-charts"
import { AgentPerformanceTable, AgentPerformance } from "@features/reports/components/agent-performance-table"
import { CallLogPagination } from "@features/call-logs/components/call-log-pagination"
import { api } from "@shared/api/api"
import { PaginatedResponse } from "@shared/types"

export default function ReportsPage() {
    const [filters, setFilters] = useState<ReportFiltersData>({
        dateRange: {
            from: new Date(),
            to: new Date(),
        },
        outcome: "all",
        type: "BUSINESS",
        agentIds: null,
        teamIds: null
    })

    const [page, setPage] = useState(1)
    const [perPage, setPerPage] = useState(15)
    const [sortBy, setSortBy] = useState<string | null>(null)
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

    const queryParams = {
        start_date: filters.dateRange?.from ? format(filters.dateRange.from, 'yyyy-MM-dd') : undefined,
        end_date: filters.dateRange?.to ? format(filters.dateRange.to, 'yyyy-MM-dd') : undefined,
        outcomes: filters.outcome !== 'all' ? [filters.outcome] : undefined,
        types: filters.type !== 'all' ? [filters.type] : undefined,
        agent_ids: filters.agentIds || undefined,
        team_ids: filters.teamIds || undefined,
        contact_filter: filters.contactFilter || undefined,
    }

    const performanceQueryParams = {
        ...queryParams,
        page,
        per_page: perPage,
        sort_by: sortBy || undefined,
        sort_order: sortOrder,
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
            const res = await api.get<{ data: React.ComponentProps<typeof ReportCharts>['data'] }>(`/api/v1/admin/reports/charts?${qs}`)
            return res.data
        }
    })

    const performanceQuery = useQuery({
        queryKey: ['reports', 'performance', performanceQueryParams],
        queryFn: async () => {
            const qs = getQueryString(performanceQueryParams);
            const res = await api.get<PaginatedResponse<AgentPerformance>>(`/api/v1/admin/reports/performance?${qs}`)
            return res
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
            <ReportFilters onFilterChange={(newFilters) => {
                setFilters(newFilters);
                setPage(1);
            }} />

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
                <div id="agent-performance">
                    <h2 className="text-xl font-bold tracking-tight">Agent Performance Report</h2>
                    <p className="text-sm text-muted-foreground">See how each agent handles calls and responds to customers.</p>
                </div>

                <AgentPerformanceTable
                    data={performanceQuery.data?.data || []}
                    filters={filters}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={(key, order) => {
                        setSortBy(key);
                        setSortOrder(order);
                        setPage(1);
                    }}
                />

                {performanceQuery.data && (
                    <div className="mt-4">
                        <CallLogPagination
                            page={page}
                            perPage={perPage}
                            total={performanceQuery.data.meta.total}
                            onChange={(newPage, newPerPage) => {
                                setPage(newPage);
                                setPerPage(newPerPage);
                            }}
                        />
                    </div>
                )}
            </div>

        </div>
    )
}
