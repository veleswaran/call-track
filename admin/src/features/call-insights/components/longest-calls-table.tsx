"use client";

import { useState } from "react";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
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
import { LongestCall, CallInsightsFiltersData } from "../types";
import { LongestCallDetailsDialog } from "./longest-call-details-dialog";

interface LongestCallsTableProps {
    data: LongestCall[];
    isLoading?: boolean;
    dateFrom?: string;
    dateTo?: string;
    filters?: CallInsightsFiltersData;
}

export function LongestCallsTable({ data, isLoading, dateFrom, dateTo, filters }: LongestCallsTableProps) {
    const [selectedCall, setSelectedCall] = useState<LongestCall | null>(null);
    return (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800/80 gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                            Longest Calls Audit
                        </h2>
                        <span className="text-xs text-muted-foreground font-normal">
                            · High duration call logs
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Calls with the highest talk time to review engagement depth and handle time outliers.
                    </p>
                </div>

                <Badge variant="secondary" className="self-start sm:self-auto bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800 px-3 py-1 font-semibold text-xs">
                    Talk-Time Outliers
                </Badge>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-zinc-50/70 dark:bg-zinc-900/50">
                        <TableRow className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-transparent">
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Contact / Company</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Phone Number</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Agent</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Team</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Call Type</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Date & Time</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Duration</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Type</TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <TableRow key={i} className="animate-pulse border-b border-zinc-100 dark:border-zinc-800">
                                    <TableCell><div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                    <TableCell><div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                    <TableCell><div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                    <TableCell><div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                    <TableCell><div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                    <TableCell><div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                    <TableCell><div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                    <TableCell><div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                    <TableCell><div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-40 text-center text-sm text-muted-foreground">
                                    No calls found matching the criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item) => {
                                const isOutgoing = item.direction === "OUTGOING";
                                return (
                                    <TableRow
                                        key={item.id}
                                        className="border-b border-zinc-100 dark:border-zinc-800/80 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                                    >
                                        <TableCell className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                                            {item.customer_name}
                                        </TableCell>

                                        <TableCell className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                                            {item.phone_number}
                                        </TableCell>

                                        <TableCell>
                                            <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                                {item.agent}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground font-mono">
                                                {item.employee_code}
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-xs text-zinc-600 dark:text-zinc-400">
                                            {item.team}
                                        </TableCell>

                                        <TableCell>
                                            <span className={`inline-flex items-center gap-1 text-xs font-medium ${isOutgoing
                                                ? "text-emerald-600 dark:text-emerald-400"
                                                : "text-blue-600 dark:text-blue-400"
                                                }`}>
                                                {isOutgoing ? (
                                                    <ArrowUpRight className="h-3 w-3" />
                                                ) : (
                                                    <ArrowDownLeft className="h-3 w-3" />
                                                )}
                                                {item.direction}
                                            </span>
                                        </TableCell>

                                        <TableCell className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                                            {item.timestamp}
                                        </TableCell>

                                        <TableCell className="text-xs font-bold text-purple-700 dark:text-purple-300">
                                            {item.duration}
                                        </TableCell>

                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={`text-[10px] uppercase font-semibold ${item.classification === "BUSINESS"
                                                    ? "border-blue-200 text-blue-700 bg-blue-50/60 dark:bg-blue-950/40"
                                                    : "border-amber-200 text-amber-700 bg-amber-50/60 dark:bg-amber-950/40"
                                                    }`}
                                            >
                                                {item.classification}
                                            </Badge>
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedCall(item)}
                                                className="h-7 px-2 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/50"
                                            >
                                                View Details
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Popup Dialog showing call audit details */}
            <LongestCallDetailsDialog
                call={selectedCall}
                open={!!selectedCall}
                onOpenChange={(open) => {
                    if (!open) setSelectedCall(null);
                }}
                dateFrom={dateFrom}
                dateTo={dateTo}
                filters={filters}
            />
        </div>
    );
}
