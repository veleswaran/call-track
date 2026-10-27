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

interface TopCallDurationTableProps {
    data: TopCaller[];
    isLoading?: boolean;
    dateFrom?: string;
    dateTo?: string;
    filters?: CallInsightsFiltersData;
}

export function TopCallDurationTable({ data, isLoading, dateFrom, dateTo, filters }: TopCallDurationTableProps) {
    const [selectedCaller, setSelectedCaller] = useState<TopCaller | null>(null);
    const sortedData = [...data].sort((a, b) => b.total_duration_raw - a.total_duration_raw);

    return (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800/80 gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                            Top Call Duration Leaderboard
                        </h2>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Agents logging the most customer interaction hours across registered Android devices.
                    </p>
                </div>

                <Badge variant="secondary" className="self-start sm:self-auto bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 px-3 py-1 font-semibold text-xs">
                    Cumulative Talk Time
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
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Total Talk Time</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 text-center">Connected Calls</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Avg Duration</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 text-center">Total Calls</TableHead>
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
                                    <TableCell><div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                    <TableCell><div className="h-4 w-12 rounded bg-zinc-200 dark:bg-zinc-800 mx-auto" /></TableCell>
                                    <TableCell><div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                    <TableCell><div className="h-4 w-12 rounded bg-zinc-200 dark:bg-zinc-800 mx-auto" /></TableCell>
                                    <TableCell><div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : sortedData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-40 text-center text-sm text-muted-foreground">
                                    No duration data available.
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedData.map((item, idx) => {
                                const rank = idx + 1;
                                const isRank1 = rank === 1;
                                const isRank2 = rank === 2;
                                const isRank3 = rank === 3;

                                return (
                                    <TableRow
                                        key={item.id}
                                        className="border-b border-zinc-100 dark:border-zinc-800/80 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                                    >
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
                                                    {rank}
                                                </span>
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                                                {item.agent}
                                            </div>
                                            <div className="text-[11px] text-muted-foreground font-mono">
                                                {item.employee_code}
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-xs text-zinc-600 dark:text-zinc-300">
                                            {item.team}
                                        </TableCell>

                                        {/* Total Talk Time with relative bar */}
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                                                    {item.total_duration}
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-center font-semibold text-xs text-emerald-600 dark:text-emerald-400">
                                            {item.connected}
                                        </TableCell>

                                        <TableCell className="text-xs text-zinc-700 dark:text-zinc-300">
                                            {item.avg_duration}
                                        </TableCell>

                                        <TableCell className="text-center font-medium text-xs text-zinc-900 dark:text-zinc-100">
                                            {item.total_calls}
                                        </TableCell>

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
