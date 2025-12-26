"use client";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@shared/components/ui/card";
import { Phone, PhoneIncoming, PhoneOutgoing, Clock } from "lucide-react";
import { useDashboardMetrics } from "@features/dashboard/hooks/use-dashboard";

/**
 * Metric card component for dashboard
 */
function MetricCard({
    title,
    value,
    icon: Icon,
    description,
    isLoading = false,
}: {
    title: string;
    value: string | number;
    icon: typeof Phone;
    description?: string;
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
                {description && (
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
    if (seconds < 60) return `${seconds}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
}

/**
 * Dashboard page - displays key metrics and summary from API
 */
export default function DashboardPage() {
    const { data: metrics, isLoading } = useDashboardMetrics();

    const totalCalls = metrics?.total_calls ?? 0;
    const businessCalls = metrics?.business_calls ?? 0;
    const personalCalls = metrics?.personal_calls ?? 0;
    const durationSeconds = metrics?.total_duration_seconds ?? 0;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-zinc-500 dark:text-zinc-400">
                    Overview of your call tracking metrics
                </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Total Calls"
                    value={totalCalls.toLocaleString()}
                    icon={Phone}
                    description="All time"
                    isLoading={isLoading}
                />
                <MetricCard
                    title="Business Calls"
                    value={businessCalls.toLocaleString()}
                    icon={PhoneIncoming}
                    description="Classified as business"
                    isLoading={isLoading}
                />
                <MetricCard
                    title="Personal Calls"
                    value={personalCalls.toLocaleString()}
                    icon={PhoneOutgoing}
                    description="Classified as personal"
                    isLoading={isLoading}
                />
                <MetricCard
                    title="Total Duration"
                    value={formatDuration(durationSeconds)}
                    icon={Clock}
                    description="Combined call time"
                    isLoading={isLoading}
                />
            </div>

            {/* Placeholder for future content */}
            <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
                <p className="text-zinc-500 dark:text-zinc-400">
                    Recent activity and charts will appear here
                </p>
            </div>
        </div>
    );
}
