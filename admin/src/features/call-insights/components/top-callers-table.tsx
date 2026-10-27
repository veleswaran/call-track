"use client";

import { useState } from "react";
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
import { TopCaller, CallInsightsFiltersData } from "../types";
import { TopCallerCallsDialog } from "./top-caller-calls-dialog";

interface TopCallersTableProps {
    data: TopCaller[];
    isLoading?: boolean;
    dateFrom?: string;
    dateTo?: string;
    filters?: CallInsightsFiltersData;
}

export function TopCallersTable({ data, isLoading, dateFrom, dateTo, filters }: TopCallersTableProps) {
    const [selectedCaller, setSelectedCaller] = useState<TopCaller | null>(null);
    const getInitials = (name: string): string => {
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    const getAvatarColor = (name: string): string => {
        const colors = [
            "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
            "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
            "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
            "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
            "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
            "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
            "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
            {/* Table Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800/80 gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                            Top Callers Leaderboard
                        </h2>
                        <span className="text-xs text-muted-foreground font-normal">
                            · Rank by total call volume
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Agents generating the highest outbound and inbound outreach volume across official devices.
                    </p>
                </div>

                <Badge variant="secondary" className="self-start sm:self-auto bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800 px-3 py-1 font-semibold text-xs">
                    Top Performers
                </Badge>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-zinc-50/70 dark:bg-zinc-900/50">
                        <TableRow className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-transparent">
                            <TableHead className="w-[70px] text-xs font-semibold text-zinc-600 dark:text-zinc-400">Rank</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Agent</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Team</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 text-center">Total Calls</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 text-center">Connected</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 text-center">Missed</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Handling Rate</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Total Duration</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <TableRow key={i} className="animate-pulse border-b border-zinc-100 dark:border-zinc-800">
                                    <TableCell><div className="h-6 w-6 rounded-full bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                    <TableCell><div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                    <TableCell><div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                    <TableCell><div className="h-4 w-12 rounded bg-zinc-200 dark:bg-zinc-800 mx-auto" /></TableCell>
                                    <TableCell><div className="h-4 w-12 rounded bg-zinc-200 dark:bg-zinc-800 mx-auto" /></TableCell>
                                    <TableCell><div className="h-4 w-12 rounded bg-zinc-200 dark:bg-zinc-800 mx-auto" /></TableCell>
                                    <TableCell><div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                    <TableCell><div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                    <TableCell><div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-40 text-center text-sm text-muted-foreground">
                                    No top callers data available for the selected criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item) => {
                                const isRank1 = item.rank === 1;
                                const isRank2 = item.rank === 2;
                                const isRank3 = item.rank === 3;
                                const handlingIsLow = item.handling_rate < 50;

                                return (
                                    <TableRow
                                        key={item.id}
                                        className="border-b border-zinc-100 dark:border-zinc-800/80 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                                    >
                                        {/* Rank */}
                                        <TableCell>
                                            {isRank1 ? (
                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-xs shadow-sm">
                                                    1
                                                </span>
                                            ) : isRank2 ? (
                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-bold text-xs shadow-sm">
                                                    2
                                                </span>
                                            ) : isRank3 ? (
                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 font-bold text-xs shadow-sm">
                                                    3
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground font-medium pl-2">
                                                    {item.rank}
                                                </span>
                                            )}
                                        </TableCell>

                                        {/* Agent */}
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${getAvatarColor(
                                                        item.agent
                                                    )}`}
                                                >
                                                    {getInitials(item.agent)}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                                                        {item.agent}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground uppercase tracking-wider">
                                                        {item.employee_code}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Team */}
                                        <TableCell>
                                            <span className="text-xs text-zinc-600 dark:text-zinc-300">
                                                {item.team}
                                            </span>
                                        </TableCell>

                                        {/* Total Calls */}
                                        <TableCell className="text-center font-bold text-xs text-zinc-900 dark:text-zinc-100">
                                            {item.total_calls}
                                        </TableCell>

                                        {/* Connected */}
                                        <TableCell className="text-center font-semibold text-xs text-emerald-600 dark:text-emerald-400">
                                            {item.connected}
                                        </TableCell>

                                        {/* Missed */}
                                        <TableCell className="text-center font-semibold text-xs text-rose-600 dark:text-rose-400">
                                            {item.missed}
                                        </TableCell>

                                        {/* Handling Rate with Progress Bar */}
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`text-xs font-semibold ${
                                                        handlingIsLow
                                                            ? "text-rose-600 dark:text-rose-400"
                                                            : "text-zinc-800 dark:text-zinc-200"
                                                    }`}
                                                >
                                                    {item.handling_rate}%
                                                </span>
                                                {/* <div className="flex-1 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${
                                                            handlingIsLow ? "bg-rose-500" : "bg-blue-600"
                                                        }`}
                                                        style={{ width: `${Math.min(100, item.handling_rate)}%` }}
                                                    />
                                                </div> */}
                                            </div>
                                        </TableCell>

                                        {/* Total Duration */}
                                        <TableCell className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                                            {item.total_duration}
                                        </TableCell>

                                        {/* Action Button */}
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedCaller(item)}
                                                className="h-7 px-2 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/50"
                                            >
                                                View Calls
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Popup Dialog showing call details for selected top caller with current filters */}
            <TopCallerCallsDialog
                caller={selectedCaller}
                open={!!selectedCaller}
                onOpenChange={(open) => {
                    if (!open) setSelectedCaller(null);
                }}
                filters={filters}
                dateFrom={dateFrom}
                dateTo={dateTo}
            />
        </div>
    );
}
