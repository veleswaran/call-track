"use client";

import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import type { VolumeTrendData } from "../hooks/use-dashboard";

interface CallVolumeTrendsChartProps {
    data: VolumeTrendData[];
    isLoading?: boolean;
}

/**
 * Bar chart showing call volume trends - current week vs previous week
 */
export function CallVolumeTrendsChart({
    data,
    isLoading = false,
}: CallVolumeTrendsChartProps) {
    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center rounded-lg border bg-zinc-50 dark:bg-zinc-900">
                <div className="h-8 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
        );
    }

    return (
        <div className="rounded-lg border bg-white p-4 dark:bg-zinc-950">
            <h3 className="mb-4 text-lg font-semibold">Call Volume Trends</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                        <XAxis
                            dataKey="day"
                            className="text-xs fill-zinc-500"
                            tick={{ fill: "currentColor" }}
                        />
                        <YAxis
                            className="text-xs fill-zinc-500"
                            tick={{ fill: "currentColor" }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "var(--color-zinc-50)",
                                borderColor: "var(--color-zinc-200)",
                                borderRadius: "8px",
                            }}
                        />
                        <Legend />
                        <Bar
                            dataKey="current"
                            name="This Week"
                            fill="#2b66c4ff"
                            radius={[4, 4, 0, 0]}
                        />
                        <Bar
                            dataKey="previous"
                            name="Last Week"
                            fill="#cc5a3dff"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
