"use client";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@shared/components/ui/card";
import { Phone, Clock, Smartphone, Timer, TrendingUp, TrendingDown } from "lucide-react";
import { useDashboardMetrics, useDashboardCharts } from "@features/dashboard/hooks/use-dashboard";
import { CallVolumeTrendsChart } from "@features/dashboard/components/CallVolumeTrendsChart";
import { CallOutcomeChart } from "@features/dashboard/components/CallOutcomeChart";

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
}: {
    title: string;
    value: string | number;
    icon: typeof Phone;
    description?: string;
    changePercent?: number | null;
    isLoading?: boolean;
}) {
    return (
        <Card>
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
 * Dashboard page - displays key metrics for current week with comparison and charts
 */
export default function DashboardPage() {
    const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
    const { data: charts, isLoading: chartsLoading } = useDashboardCharts();

    const totalCalls = metrics?.total_calls ?? 0;
    const activeDevices = metrics?.active_devices ?? 0;
    const avgDuration = metrics?.average_call_duration_seconds ?? 0;
    const durationSeconds = metrics?.total_duration_seconds ?? 0;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-zinc-500 dark:text-zinc-400">
                    This week&apos;s call tracking metrics
                </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Total Calls"
                    value={totalCalls.toLocaleString()}
                    icon={Phone}
                    changePercent={metrics?.total_calls_change_percent}
                    isLoading={metricsLoading}
                />
                <MetricCard
                    title="Active Devices"
                    value={activeDevices.toLocaleString()}
                    icon={Smartphone}
                    changePercent={metrics?.active_devices_change_percent}
                    isLoading={metricsLoading}
                />
                <MetricCard
                    title="Avg Call Duration"
                    value={formatDuration(avgDuration)}
                    icon={Timer}
                    changePercent={metrics?.average_call_duration_change_percent}
                    isLoading={metricsLoading}
                />
                <MetricCard
                    title="Total Duration"
                    value={formatDuration(durationSeconds)}
                    icon={Clock}
                    changePercent={metrics?.total_duration_change_percent}
                    isLoading={metricsLoading}
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
