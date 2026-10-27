"use client";

import { useState } from "react";
import { Phone, Clock, PhoneCall, PhoneMissed } from "lucide-react";
import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@shared/components/ui/table";
import { useSettingsQuery } from "@features/settings/hooks/use-settings";
import { AgentInsightsData, CallInsightsFiltersData } from "../types";
import { AgentWiseCallsDialog } from "./agent-wise-calls-dialog";

interface AgentWiseInsightsProps {
    data: AgentInsightsData | null;
    isLoading?: boolean;
    dateFrom?: string;
    dateTo?: string;
    filters?: CallInsightsFiltersData;
}

export function AgentWiseInsights({ data, isLoading, dateFrom, dateTo, filters }: AgentWiseInsightsProps) {
    const [showCallsDialog, setShowCallsDialog] = useState(false);
    const { data: settings } = useSettingsQuery();
    const slaHours = settings?.escalation_sla_hours ?? 24;

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-28 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-28 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-72 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                    <div className="h-72 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                </div>
            </div>
        );
    }

    if (!data || !data.agent) {
        return (
            <div className="p-12 text-center border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900">
                <p className="text-sm text-muted-foreground">
                    No agent activity data available for the selected period. Try selecting an agent in the filter bar.
                </p>
            </div>
        );
    }

    const { agent, kpis, daily_distribution, outreach_characteristics } = data;

    return (
        <div className="space-y-6">
            {/* Agent Header Card */}
            <div className="p-5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold text-lg flex items-center justify-center shrink-0 shadow-inner">
                        {agent.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white truncate">
                                {agent.name}
                            </h2>
                            <Badge variant="outline" className="text-xs uppercase font-mono px-2 py-0.5 border-zinc-200">
                                {agent.employee_code}
                            </Badge>
                            <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5">
                                {agent.team}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            <span className="font-mono">{agent.device_hardware_id}</span>
                            <span>•</span>
                            <span>First Call: <strong className="text-zinc-700 dark:text-zinc-300">{agent.first_call_time}</strong></span>
                            <span>•</span>
                            <span>Handling Rate: <strong className="text-zinc-700 dark:text-zinc-300">{agent.handling_rate}%</strong></span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        type="button"
                        onClick={() => setShowCallsDialog(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm text-xs font-semibold"
                    >
                        <PhoneCall className="h-3.5 w-3.5" />
                        <span>View Call Logs</span>
                    </Button>
                </div>
            </div>

            {/* 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Calls in Period */}
                <div className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Calls in Selected Period</span>
                        <Phone className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="my-2 text-2xl font-bold text-zinc-900 dark:text-white">
                        {kpis.calls_in_period}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Official Android device
                    </div>
                </div>

                {/* Connected Calls */}
                <div className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Connected Calls</span>
                        <PhoneCall className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="my-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {kpis.connected_calls}
                        </span>
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            {kpis.connected_rate}%
                        </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Successful connection rate
                    </div>
                </div>

                {/* Missed Calls */}
                <div className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Missed Calls</span>
                        <PhoneMissed className="h-4 w-4 text-rose-500" />
                    </div>
                    <div className="my-2 flex items-baseline gap-2 flex-wrap">
                        {kpis.pending_missed_calls !== undefined && kpis.pending_missed_calls !== kpis.missed_calls ? (
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                                    {kpis.pending_missed_calls}
                                </span>
                                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                    / {kpis.missed_calls}
                                </span>
                            </div>
                        ) : (
                            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                                {kpis.missed_calls}
                            </span>
                        )}
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            SLA: {kpis.sla_resolution_rate}% Res.
                        </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Follow-ups within {slaHours}h
                    </div>
                </div>

                {/* Total Talk Time */}
                <div className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Total Talk Time</span>
                        <Clock className="h-4 w-4 text-purple-500" />
                    </div>
                    <div className="my-2 text-2xl font-bold text-zinc-900 dark:text-white">
                        {kpis.total_talk_time}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                        Avg: {kpis.avg_talk_time} per call
                    </div>
                </div>
            </div>

            {/* 2 Column Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Daily Distribution */}
                <div className="lg:col-span-2 p-5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                                Daily Call Distribution for {agent.name}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Aggregated volume, connections, and duration over selected period.
                            </p>
                        </div>
                        <Badge variant="outline" className="text-xs font-semibold text-blue-600 border-blue-200 bg-blue-50/50 dark:bg-blue-950/40">
                            Timeline View
                        </Badge>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-zinc-50/60 dark:bg-zinc-800/40">
                                <TableRow className="border-b border-zinc-100 dark:border-zinc-800">
                                    <TableHead className="text-xs font-semibold">Date</TableHead>
                                    <TableHead className="text-xs font-semibold text-center">Total Calls</TableHead>
                                    <TableHead className="text-xs font-semibold text-center">Connected</TableHead>
                                    <TableHead className="text-xs font-semibold text-center">Missed</TableHead>
                                    <TableHead className="text-xs font-semibold">Talk Duration</TableHead>
                                    <TableHead className="text-xs font-semibold">Performance Bar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {daily_distribution.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-xs text-muted-foreground">
                                            No daily calls logged in this period.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    daily_distribution.map((day) => (
                                        <TableRow key={day.raw_date} className="border-b border-zinc-100 dark:border-zinc-800/80">
                                            <TableCell className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                                                {day.date}
                                            </TableCell>
                                            <TableCell className="text-xs font-bold text-center text-zinc-900 dark:text-zinc-100">
                                                {day.total_calls}
                                            </TableCell>
                                            <TableCell className="text-xs font-semibold text-center text-emerald-600 dark:text-emerald-400">
                                                {day.connected}
                                            </TableCell>
                                            <TableCell className="text-xs font-semibold text-center text-rose-600 dark:text-rose-400">
                                                {day.missed}
                                            </TableCell>
                                            <TableCell className="text-xs text-zinc-700 dark:text-zinc-300">
                                                {day.talk_duration}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 min-w-[100px]">
                                                    <div className="flex-1 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-blue-600"
                                                            style={{ width: `${Math.min(100, day.performance_percentage)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                                                        {day.performance_percentage}%
                                                    </span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Right: Outreach Characteristics */}
                <div className="p-5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-sm space-y-5">
                    <div>
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                            Outreach Characteristics
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Behavioral profile and device configuration.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {/* Direction Split */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-medium">
                                <span className="text-zinc-600 dark:text-zinc-400">Call Type Split</span>
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                    {outreach_characteristics.direction.outbound_pct}% Out / {outreach_characteristics.direction.inbound_pct}% In
                                </span>
                            </div>
                            <div className="h-2 rounded-full overflow-hidden flex bg-zinc-100 dark:bg-zinc-800">
                                <div
                                    className="bg-emerald-500 h-full"
                                    style={{ width: `${outreach_characteristics.direction.outbound_pct}%` }}
                                    title="Outbound"
                                />
                                <div
                                    className="bg-blue-500 h-full"
                                    style={{ width: `${outreach_characteristics.direction.inbound_pct}%` }}
                                    title="Inbound"
                                />
                            </div>
                        </div>

                        {/* Dual SIM Allocation */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-medium">
                                <span className="text-zinc-600 dark:text-zinc-400">Dual SIM Allocation</span>
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                    SIM 1 ({outreach_characteristics.sim_allocation.sim_1_pct}%) / SIM 2 ({outreach_characteristics.sim_allocation.sim_2_pct}%)
                                </span>
                            </div>
                            <div className="h-2 rounded-full overflow-hidden flex bg-zinc-100 dark:bg-zinc-800">
                                <div
                                    className="bg-purple-600 h-full"
                                    style={{ width: `${outreach_characteristics.sim_allocation.sim_1_pct}%` }}
                                    title="SIM 1"
                                />
                                <div
                                    className="bg-cyan-500 h-full"
                                    style={{ width: `${outreach_characteristics.sim_allocation.sim_2_pct}%` }}
                                    title="SIM 2"
                                />
                            </div>
                        </div>

                        {/* Classification Split */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-medium">
                                <span className="text-zinc-600 dark:text-zinc-400">Type (BRD 7.1)</span>
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                    Business ({outreach_characteristics.classification.business_pct}%) / Personal ({outreach_characteristics.classification.personal_pct}%)
                                </span>
                            </div>
                            <div className="h-2 rounded-full overflow-hidden flex bg-zinc-100 dark:bg-zinc-800">
                                <div
                                    className="bg-blue-600 h-full"
                                    style={{ width: `${outreach_characteristics.classification.business_pct}%` }}
                                    title="Business"
                                />
                                <div
                                    className="bg-amber-400 h-full"
                                    style={{ width: `${outreach_characteristics.classification.personal_pct}%` }}
                                    title="Personal"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Agent Call Details Dialog with current filters */}
            <AgentWiseCallsDialog
                agent={agent}
                kpis={kpis}
                open={showCallsDialog}
                onOpenChange={setShowCallsDialog}
                filters={filters}
                dateFrom={dateFrom}
                dateTo={dateTo}
            />
        </div>
    );
}
