"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { format, differenceInCalendarDays } from "date-fns"
import { LayoutList, Calendar, Download } from "lucide-react"

import { useAuth } from "@features/auth/hooks/use-auth"
import { ReportFilters, ReportFiltersData } from "@features/reports/components/report-filters"
import { downloadDayWiseReportCsv } from "@features/reports/utils/export-day-wise-report-csv"
import { ReportSummary } from "@features/reports/components/report-summary"
import { ReportCharts } from "@features/reports/components/report-charts"
import { AgentPerformanceTable, AgentPerformance } from "@features/reports/components/agent-performance-table"
import { DayWiseReportTable, DayWiseReportData } from "@features/reports/components/day-wise-report-table"
import { CallLogPagination } from "@features/call-logs/components/call-log-pagination"
import { Button } from "@shared/components/ui/button"
import { Alert, AlertDescription } from "@shared/components/ui/alert"
import { api } from "@shared/api/api"
import { PaginatedResponse } from "@shared/types"

type ViewMode = 'table' | 'day-wise'

export default function ReportsPage() {
    const { user } = useAuth()
    const isSuperAdmin = user?.roles?.includes("super-admin")

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

    const [viewMode, setViewMode] = useState<ViewMode>('table')
    const [page, setPage] = useState(1)
    const [perPage, setPerPage] = useState(15)
    const [sortBy, setSortBy] = useState<string | null>('agent')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
    const [isExporting, setIsExporting] = useState(false)

    const { from: dateRangeFrom, to: dateRangeTo } = filters.dateRange ?? {}
    const hasCompleteDateRange = Boolean(dateRangeFrom && dateRangeTo)

    const dateRangeDays = useMemo(() => {
        if (!dateRangeFrom || !dateRangeTo) return 0
        return differenceInCalendarDays(dateRangeTo, dateRangeFrom) + 1
    }, [dateRangeFrom, dateRangeTo])

    const canShowDayWise = hasCompleteDateRange && dateRangeDays <= 60
    const exceedsDayWiseLimit = hasCompleteDateRange && dateRangeDays > 60

    const queryParams = {
        start_date: dateRangeFrom ? format(dateRangeFrom, 'yyyy-MM-dd') : undefined,
        end_date: dateRangeTo ? format(dateRangeTo, 'yyyy-MM-dd') : undefined,
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

    const getQueryString = (params: Record<string, string | number | boolean | (string | number)[] | undefined | null>) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                if (Array.isArray(value)) {
                    value.forEach(v => searchParams.append(`${key}[]`, String(v)));
                } else if (typeof value === 'boolean') {
                    if (value) {
                        searchParams.append(key, '1');
                    }
                } else {
                    searchParams.append(key, String(value));
                }
            }
        });
        return searchParams.toString();
    }

    const handleExportDayWiseCsv = async () => {
        setIsExporting(true)
        try {
            const qs = getQueryString({ ...queryParams, for_export: true })
            const res = await api.get<{ data: DayWiseReportData }>(`/api/v1/admin/reports/day-wise?${qs}`)
            if (res.data?.agents.length) {
                downloadDayWiseReportCsv(res.data)
            }
        } finally {
            setIsExporting(false)
        }
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

    const dayWiseQuery = useQuery({
        queryKey: ['reports', 'day-wise', queryParams],
        queryFn: async () => {
            const qs = getQueryString(queryParams);
            const res = await api.get<{ data: DayWiseReportData }>(`/api/v1/admin/reports/day-wise?${qs}`)
            return res.data
        },
        enabled: viewMode === 'day-wise' && canShowDayWise
    })

    return (
        <div className="flex flex-col gap-6 w-full overflow-hidden">
            {/* Header Section */}
            <div className="bg-zinc-50 dark:bg-zinc-950 pb-4 pt-6 px-6 border-b border-zinc-200 dark:border-zinc-800">
                <div className="space-y-4">
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
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="px-6 space-y-6">
                <ReportSummary metrics={metricsQuery.data || []} isLoading={metricsQuery.isLoading} />

                <div className="space-y-4 w-full overflow-hidden">
                    <div id="agent-performance" className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">Agent Performance Report</h2>
                            <p className="text-sm text-muted-foreground">See how each agent handles calls and responds to customers.</p>
                        </div>

                        {/* View Toggle */}
                        <div className="flex items-center gap-2">
                        {isSuperAdmin && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                disabled={isExporting || !hasCompleteDateRange}
                                onClick={handleExportDayWiseCsv}
                            >
                                <Download className="h-4 w-4" />
                                {isExporting ? "Exporting..." : "Export Day-Wise CSV"}
                            </Button>
                        )}
                        <Button
                            variant={viewMode === 'table' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('table')}
                            className="gap-2"
                        >
                            <LayoutList className="h-4 w-4" />
                            Table View
                        </Button>
                        <Button
                            variant={viewMode === 'day-wise' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                                if (canShowDayWise) {
                                    setViewMode('day-wise')
                                }
                            }}
                            disabled={!canShowDayWise}
                            className="gap-2"
                        >
                            <Calendar className="h-4 w-4" />
                            Day-Wise View
                        </Button>
                    </div>
                </div>

                {/* 60-day limit warning */}
                {exceedsDayWiseLimit && (
                    <Alert variant="destructive">
                        <AlertDescription>
                            Day-wise view is only available for date ranges up to 60 days.
                            Current selection: {dateRangeDays} days. Use Export Day-Wise CSV to download longer periods.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Table View */}
                {viewMode === 'table' && (
                    <>
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
                    </>
                )}

                    {/* Day-Wise View */}
                    {viewMode === 'day-wise' && (
                        <DayWiseReportTable
                            data={dayWiseQuery.data || null}
                            isLoading={dayWiseQuery.isLoading}
                        />
                    )}
                </div>
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
            </div>
        </div>
    )
}
