"use client";

import {
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import type { OutcomeData } from "../hooks/use-dashboard";

interface CallOutcomeChartProps {
    data: OutcomeData[];
    isLoading?: boolean;
}

const COLORS = {
    Connected: "#22c55e", // green
    Missed: "#ef4444", // red
    "No Answer": "#2b66c4ff", // blue
};

/**
 * Pie chart showing call outcome distribution
 */
export function CallOutcomeChart({
    data,
    isLoading = false,
}: CallOutcomeChartProps) {
    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center rounded-lg border bg-zinc-50 dark:bg-zinc-900">
                <div className="h-8 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
        );
    }

    // Filter out zero values for cleaner visualization
    const filteredData = data.filter((item) => item.value > 0);

    if (filteredData.length === 0) {
        return (
            <div className="rounded-lg border bg-white p-4 dark:bg-zinc-950">
                <h3 className="mb-4 text-lg font-semibold">Call Outcome Distribution</h3>
                <div className="flex h-64 items-center justify-center text-zinc-500">
                    No call data available
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-lg border bg-white p-4 dark:bg-zinc-950">
            <h3 className="mb-4 text-lg font-semibold">Call Outcome Distribution</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={filteredData as Array<{ name: string; value: number;[key: string]: unknown }>}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) =>
                                `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {filteredData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[entry.name as keyof typeof COLORS] || "#8884d8"}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "var(--popover)",
                                borderColor: "var(--border)",
                                borderRadius: "8px",
                                color: "var(--popover-foreground)",
                            }}
                            itemStyle={{
                                color: "var(--popover-foreground)",
                            }}
                        />
                        <Legend
                            wrapperStyle={{
                                paddingTop: "20px",
                                color: "var(--foreground)",
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
