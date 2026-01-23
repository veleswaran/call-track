"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card"

interface ChartDataPoint {
    name: string
    value: number
    fill?: string
    [key: string]: string | number | undefined
}

interface CallsPerDayPoint {
    date: string
    connected: number
    missed: number
    no_answer: number
}

interface PeakHourPoint {
    hour: number
    label: string
    value: number
}

interface ReportChartsProps {
    data: {
        calls_per_day: CallsPerDayPoint[]
        status_distribution: ChartDataPoint[]
        peak_call_hours: PeakHourPoint[]
        caller_types: ChartDataPoint[]
        call_direction_distribution: ChartDataPoint[]
    }
}

const COLORS = ['#22c55e', '#ef4444', '#eab308', '#3b82f6', '#a855f7'];

export function ReportCharts({ data }: ReportChartsProps) {

    // Status Distribution - Custom Label for Donut Inner Total?
    const totalCalls = data.status_distribution.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">

            {/* Calls Per Day - Full Width */}
            <Card className="col-span-full">
                <CardHeader>
                    <CardTitle>Calls Per Day</CardTitle>
                    <CardDescription>Call volume over the selected period</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.calls_per_day}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend verticalAlign="top" height={48} wrapperStyle={{ fontSize: '12px', paddingBottom: '8px' }} />
                            <Bar dataKey="connected" name="Connected" stackId="a" fill="#22c55e" radius={[0, 0, 4, 4]} barSize={40} />
                            <Bar dataKey="missed" name="Missed" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} barSize={40} />
                            <Bar dataKey="no_answer" name="No Answer" stackId="a" fill="#eab308" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card className="col-span-full md:col-span-1 lg:col-span-3">
                <CardHeader>
                    <CardTitle>Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={data.status_distribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    nameKey="name"
                                    labelLine={false}
                                    label={({ value }) => `${((value / totalCalls) * 100).toFixed(0)}%`}
                                >
                                    {data.status_distribution?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                {/* CENTER NUMBER */}
                                <text
                                    x="50%"
                                    y="40%"
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    className="text-xl font-semibold fill-gray-900"
                                >
                                    {totalCalls}
                                </text>
                                <text
                                    x="50%"
                                    y="50%"
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    className="text-xs fill-gray-500 uppercase"
                                >
                                    Calls
                                </text>
                                <Tooltip />
                                <Legend verticalAlign="bottom" align="center" layout="horizontal" iconType="circle" wrapperStyle={{ paddingTop: '16px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Peak Call Hours */}
            <Card className="col-span-full md:col-span-1 lg:col-span-4">
                <CardHeader>
                    <CardTitle>Peak Call Hours</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={data.peak_call_hours}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="label"
                                stroke="#888888"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                interval={2} // Show every 3rd label
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={10} />
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                        <span className="h-2 w-2 rounded-full bg-yellow-500" />
                        {(() => {
                            if (!data.peak_call_hours?.length) return "No call data available.";

                            const max = Math.max(...data.peak_call_hours.map(d => d.value));
                            if (max === 0) return "No calls recorded in this period.";

                            const peakHours = data.peak_call_hours.filter(d => d.value === max);
                            // If multiple peak hours, show the first one or a range explanation
                            const peakLabel = peakHours[0].label;

                            return `Most calls occur around ${peakLabel}.`;
                        })()}
                    </div>
                </CardContent>
            </Card>

            {/* Follow-Up / Caller Type Breakdown */}
            {/* Skipping Follow-Up pending implementation as it requires persistence of follow-up state */}

            {/* Caller Type Breakdown */}
            <Card className="col-span-full md:col-span-1 lg:col-span-3">
                <CardHeader>
                    <CardTitle>Caller Type Breakdown</CardTitle>
                    <CardDescription>New vs Returning Callers</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={data.caller_types}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                nameKey="name"
                                labelLine={false}
                                label={({ value }) => `${((value / totalCalls) * 100).toFixed(0)}%`}
                            >
                                {data.caller_types.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <text
                                x="50%"
                                y="40%"
                                textAnchor="middle"
                                dominantBaseline="central"
                                className="text-xl font-semibold fill-gray-900"
                            >
                                {data.caller_types.reduce((sum, item) => sum + item.value, 0)}
                            </text>
                            <text
                                x="50%"
                                y="50%"
                                textAnchor="middle"
                                dominantBaseline="central"
                                className="text-xs fill-gray-500 uppercase"
                            >
                                Callers
                            </text>
                            <Tooltip />
                            <Legend verticalAlign="bottom" align="center" layout="horizontal" wrapperStyle={{ paddingTop: '16px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Call Direction Distribution */}
            <Card className="col-span-full md:col-span-1 lg:col-span-4">
                <CardHeader>
                    <CardTitle>Call Direction</CardTitle>
                    <CardDescription>Incoming vs Outgoing</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={data.call_direction_distribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                nameKey="name"
                                labelLine={false}
                                label={({ value }) => `${((value / totalCalls) * 100).toFixed(0)}%`}
                            >
                                {data.call_direction_distribution?.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <text
                                x="50%"
                                y="40%"
                                textAnchor="middle"
                                dominantBaseline="central"
                                className="text-xl font-semibold fill-gray-900"
                            >
                                {data.call_direction_distribution?.reduce(
                                    (sum, item) => sum + item.value,
                                    0
                                )}
                            </text>
                            <text
                                x="50%"
                                y="50%"
                                textAnchor="middle"
                                dominantBaseline="central"
                                className="text-xs fill-gray-500 uppercase"
                            >
                                Calls
                            </text>
                            <Tooltip />
                            <Legend verticalAlign="bottom" align="center" layout="horizontal" wrapperStyle={{ paddingTop: '16px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

        </div >
    )
}
