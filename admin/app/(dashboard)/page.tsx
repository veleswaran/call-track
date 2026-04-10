"use client";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@shared/components/ui/card";
import { Phone, Clock, Timer, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { useDashboardMetrics, useDashboardCharts } from "@features/dashboard/hooks/use-dashboard";
import { CallVolumeTrendsChart } from "@features/dashboard/components/CallVolumeTrendsChart";
import { CallOutcomeChart } from "@features/dashboard/components/CallOutcomeChart";
import { DashboardFilters, DashboardFiltersData } from "@features/dashboard/components/DashboardFilters";
import { MissedCallMetricCard } from "@features/missed-calls/components/MissedCallMetricCard";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@shared/utils";
import { useState } from "react";

/**
 * Comparison indicator component showing percentage change
 */
function ComparisonIndicator({ value }: { value: number | null }) {
    if (value === null) {
        return null;
    }

    const isPositive = value >= 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPositive
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-red-600 dark:text-red-400";

    return (
        <div className={`flex items-center gap-1 text-xs ${colorClass}`}>
            <Icon className="h-3 w-3" />
            <span>{Math.abs(value)}%</span>
            <span className="text-zinc-500 dark:text-zinc-400">vs last week</span>
        </div>
    );
}

/**
 * Metric card component for dashboard
 */
function MetricCard({
    title,
    value,
    icon: Icon,
    description,
    changePercent,
    isLoading = false,
    href,
}: {
    title: string;
    value: string | number;
    icon: typeof Phone;
    description?: string;
    changePercent?: number | null;
    isLoading?: boolean;
    href?: string;
}) {
    const cardContent = (
        <Card className={cn(href && "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="h-8 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                ) : (
                    <div className="text-2xl font-bold">{value}</div>
                )}
                {changePercent !== undefined && !isLoading && (
                    <ComparisonIndicator value={changePercent} />
                )}
                {description && changePercent === undefined && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    );

    if (href) {
        return <Link href={href}>{cardContent}</Link>;
    }

    return cardContent;
}

/**
 * Format duration in seconds to human readable string (e.g. "1h 30m" or "45s")
 */
function formatDuration(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
}

/**
 * Dashboard page - displays key metrics with date filtering and comparison
 */
export default function DashboardPage() {
    const [filters, setFilters] = useState<DashboardFiltersData>({
        dateRange: {
            from: new Date(),
            to: new Date(),
        }
    });

    const startDate = filters.dateRange?.from ? format(filters.dateRange.from, 'yyyy-MM-dd') : undefined;
    const endDate = filters.dateRange?.to ? format(filters.dateRange.to, 'yyyy-MM-dd') : undefined;

    const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics(startDate, endDate);
    const { data: charts, isLoading: chartsLoading } = useDashboardCharts(startDate, endDate);

    const totalCalls = metrics?.total_calls ?? 0;
    const missedCalls = metrics?.missed_calls ?? 0;
    const avgDuration = metrics?.average_call_duration_seconds ?? 0;
    const durationSeconds = metrics?.total_duration_seconds ?? 0;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Overview of call tracking performance
                    </p>
                </div>
                <Link
                    href="/reports#agent-performance"
                    className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                    Agent Performance Report
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </div>

            <DashboardFilters onFilterChange={setFilters} />

            {/* Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Total Calls"
                    value={totalCalls.toLocaleString()}
                    icon={Phone}
                    changePercent={metrics?.total_calls_change_percent}
                    isLoading={metricsLoading}
                    href={`/call-logs?start_date=${startDate ?? ""}&end_date=${endDate ?? ""}`}
                />
                <MissedCallMetricCard
                    total={missedCalls}
                    grandTotal={metrics?.total_missed_calls ?? 0}
                    pending={metrics?.pending_escalations ?? 0}
                    unattended={metrics?.unattended_escalations ?? 0}
                    resolved={metrics?.resolved_escalations ?? 0}
                    changePercent={metrics?.missed_calls_change_percent}
                    isLoading={metricsLoading}
                    href={`/reports/missed-calls?start_date=${startDate ?? ""}&end_date=${endDate ?? ""}`}
                />
                <MetricCard
                    title="Avg Call Duration"
                    value={formatDuration(avgDuration)}
                    icon={Timer}
                    changePercent={metrics?.average_call_duration_change_percent}
                    isLoading={metricsLoading}
                    href={`/reports?start_date=${startDate ?? ""}&end_date=${endDate ?? ""}`}
                />
                <MetricCard
                    title="Total Duration"
                    value={formatDuration(durationSeconds)}
                    icon={Clock}
                    changePercent={metrics?.total_duration_change_percent}
                    isLoading={metricsLoading}
                    href={`/reports?start_date=${startDate ?? ""}&end_date=${endDate ?? ""}`}
                />
            </div>

            {/* Charts Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                <CallVolumeTrendsChart
                    data={charts?.volume_trends ?? []}
                    isLoading={chartsLoading}
                />
                <CallOutcomeChart
                    data={charts?.outcome_distribution ?? []}
                    isLoading={chartsLoading}
                />
            </div>

        </div>
    );
}
