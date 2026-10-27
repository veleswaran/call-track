"use client";

import { useState } from "react";
import { cn } from "@shared/utils";
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
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { CallLogPagination } from "@features/call-logs/components/call-log-pagination";
import {
    CustomerSummaryItem,
    CustomerSummarySortKey,
    CustomerSummaryFiltersData,
    SortOrder,
} from "../types";
import { CustomerSummaryDetailsDialog } from "./customer-summary-details-dialog";

interface CustomerSummaryTableProps {
    data: CustomerSummaryItem[];
    isLoading?: boolean;
    page: number;
    perPage: number;
    total: number;
    sortBy?: CustomerSummarySortKey | null;
    sortOrder?: SortOrder;
    onSort?: (key: CustomerSummarySortKey) => void;
    onPageChange: (page: number, perPage: number) => void;
    filters?: CustomerSummaryFiltersData;
    dateFrom?: string;
    dateTo?: string;
}

function SortHeaderButton({
    label,
    sortKey,
    currentSortBy,
    currentSortOrder,
    onSort,
    align = "left",
}: {
    label: string;
    sortKey: CustomerSummarySortKey;
    currentSortBy?: CustomerSummarySortKey | null;
    currentSortOrder?: SortOrder;
    onSort?: (key: CustomerSummarySortKey) => void;
    align?: "left" | "center" | "right";
}) {
    const isActive = currentSortBy === sortKey;
    return (
        <button
            type="button"
            onClick={() => onSort?.(sortKey)}
            className={cn(
                "group inline-flex items-center gap-1.5 transition-colors font-semibold focus:outline-none",
                align === "center" && "mx-auto justify-center",
                align === "right" && "ml-auto justify-end",
                isActive
                    ? "text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            )}
            title={`Sort by ${label}`}
        >
            <span>{label}</span>
            {isActive ? (
                currentSortOrder === "asc" ? (
                    <ArrowUp className="h-3.5 w-3.5 text-zinc-900 dark:text-zinc-100" />
                ) : (
                    <ArrowDown className="h-3.5 w-3.5 text-zinc-900 dark:text-zinc-100" />
                )
            ) : (
                <ArrowUpDown className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
            )}
        </button>
    );
}

export function CustomerSummaryTable({
    data,
    isLoading,
    page,
    perPage,
    total,
    sortBy,
    sortOrder,
    onSort,
    onPageChange,
    filters,
    dateFrom,
    dateTo,
}: CustomerSummaryTableProps) {
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummaryItem | null>(null);

    return (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800/80 gap-3">
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                            Customer-wise Call Summary
                        </h2>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Aggregated engagement metrics per contact: total calls, missed call frequency, talk-time, and last call details.
                    </p>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-zinc-50/70 dark:bg-zinc-900/50">
                        <TableRow className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-transparent">
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 min-w-[200px]">
                                Customer / Organization
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                                Phone Number
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 text-center">
                                <SortHeaderButton
                                    label="Total Calls"
                                    sortKey="total_calls"
                                    currentSortBy={sortBy}
                                    currentSortOrder={sortOrder}
                                    onSort={onSort}
                                    align="center"
                                />
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 text-center">
                                <SortHeaderButton
                                    label="Missed Calls"
                                    sortKey="missed_calls"
                                    currentSortBy={sortBy}
                                    currentSortOrder={sortOrder}
                                    onSort={onSort}
                                    align="center"
                                />
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                                <SortHeaderButton
                                    label="Total Duration"
                                    sortKey="total_duration"
                                    currentSortBy={sortBy}
                                    currentSortOrder={sortOrder}
                                    onSort={onSort}
                                    align="left"
                                />
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                                Avg Duration
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 min-w-[220px]">
                                Last Call Details
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                                Primary Agent
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 text-right">
                                Action
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <TableRow key={i} className="animate-pulse border-b border-zinc-100 dark:border-zinc-800">
                                    <TableCell><div className="h-4 w-40 rounded bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                    <TableCell><div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                    <TableCell><div className="h-4 w-10 rounded bg-zinc-200 dark:bg-zinc-800 mx-auto" /></TableCell>
                                    <TableCell><div className="h-4 w-10 rounded bg-zinc-200 dark:bg-zinc-800 mx-auto" /></TableCell>
                                    <TableCell><div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                    <TableCell><div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                    <TableCell><div className="h-8 w-44 rounded bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                    <TableCell><div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                    <TableCell><div className="h-7 w-16 rounded bg-zinc-200 dark:bg-zinc-800 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-40 text-center text-sm text-muted-foreground">
                                    No customer records found for the selected criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item) => {
                                const lastCall = item.last_call;
                                return (
                                    <TableRow
                                        key={item.phone_hash}
                                        className="border-b border-zinc-100 dark:border-zinc-800/80 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                                    >
                                        {/* Customer / Organization */}
                                        <TableCell className="min-w-[200px]">
                                            <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                                                {item.customer_name}
                                            </div>
                                            <div className="text-[11px] text-muted-foreground mt-0.5">
                                                {item.organization}
                                            </div>
                                            {/* Mobile-visible quick metadata */}
                                            <div className="sm:hidden text-[11px] text-muted-foreground mt-0.5">
                                                <span>{item.phone_number}</span> · <span>Agent: {item.primary_agent.name}</span>
                                            </div>
                                        </TableCell>

                                        {/* Phone Number */}
                                        <TableCell className="text-xs font-mono text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                                            {item.phone_number}
                                        </TableCell>

                                        {/* Total Calls */}
                                        <TableCell className="text-center font-bold text-xs text-zinc-900 dark:text-zinc-100">
                                            {item.total_calls}
                                        </TableCell>

                                        {/* Missed Calls */}
                                        <TableCell className="text-center text-xs">
                                            {item.missed_calls > 0 ? (
                                                <span className="inline-flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
                                                    <span>{item.missed_calls}</span>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 animate-pulse" />
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">0</span>
                                            )}
                                        </TableCell>

                                        {/* Total Duration */}
                                        <TableCell className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
                                            {item.total_duration}
                                        </TableCell>

                                        {/* Avg Duration */}
                                        <TableCell className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                                            {item.avg_duration}
                                        </TableCell>

                                        {/* Last Call Details */}
                                        <TableCell className="min-w-[220px]">
                                            {lastCall ? (
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                                                            {lastCall.time}
                                                        </span>
                                                        {lastCall.is_missed ? (
                                                            <Badge
                                                                variant="outline"
                                                                className="text-[10px] font-semibold px-1.5 py-0 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                                                            >
                                                                In Missed
                                                            </Badge>
                                                        ) : (
                                                            <Badge
                                                                variant="outline"
                                                                className={cn(
                                                                    "text-[10px] font-semibold px-1.5 py-0 border",
                                                                    lastCall.direction === "OUTGOING"
                                                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                                                        : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                                                                )}
                                                            >
                                                                {lastCall.direction === "OUTGOING" ? "Out" : "In"}{" "}
                                                                {lastCall.duration_formatted}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                                        <span>Agent: <strong>{lastCall.agent_name}</strong></span>
                                                        {lastCall.agent_code !== "N/A" && (
                                                            <span className="font-mono text-[10px] text-zinc-500">
                                                                ({lastCall.agent_code})
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">—</span>
                                            )}
                                        </TableCell>

                                        {/* Primary Agent */}
                                        <TableCell className="text-xs">
                                            <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                                                {item.primary_agent.name}
                                            </div>
                                            <div className="text-[11px] text-muted-foreground">
                                                {item.primary_agent.team}
                                            </div>
                                        </TableCell>

                                        {/* Action: View Details Button */}
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedCustomer(item)}
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

            {/* Pagination */}
            {total > 0 && (
                <div className="p-4 border-t border-zinc-100 dark:border-zinc-800">
                    <CallLogPagination
                        page={page}
                        perPage={perPage}
                        total={total}
                        onChange={onPageChange}
                    />
                </div>
            )}

            {/* Customer Details Modal with Call History & Filter Scope */}
            <CustomerSummaryDetailsDialog
                customer={selectedCustomer}
                open={!!selectedCustomer}
                onOpenChange={(open) => {
                    if (!open) setSelectedCustomer(null);
                }}
                filters={filters}
                dateFrom={dateFrom}
                dateTo={dateTo}
            />
        </div>
    );
}
