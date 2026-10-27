"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@shared/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@shared/components/ui/table";
import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import {
    PhoneIncoming,
    PhoneOutgoing,
    PhoneMissed,
    PhoneOff,
    Ban,
    HelpCircle,
    ExternalLink,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Clock,
    PhoneCall,
    Hourglass,
    Smartphone,
    UserCheck,
} from "lucide-react";
import { useCallLogs, CallLogFilters } from "@features/call-logs/hooks/use-call-logs";
import { formatDuration } from "@shared/utils/time";
import { CustomerSummaryItem, CustomerSummaryFiltersData } from "../types";

export interface CustomerSummaryDetailsDialogProps {
    customer: CustomerSummaryItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters?: CustomerSummaryFiltersData;
    dateFrom?: string;
    dateTo?: string;
}

export function CustomerSummaryDetailsDialog({
    customer,
    open,
    onOpenChange,
    filters,
    dateFrom,
    dateTo,
}: CustomerSummaryDetailsDialogProps) {
    const [page, setPage] = useState(1);
    const perPage = 15;

    // Build query filters scoped to this customer's phone number
    const queryFilters: CallLogFilters = useMemo(() => {
        if (!customer) return {};

        const params: CallLogFilters = {
            search: customer.phone_number,
            start_date: dateFrom,
            end_date: dateTo,
            page,
            per_page: perPage,
        };

        if (filters?.outcome && filters.outcome !== "all") {
            params.outcomes = [filters.outcome as "Connected" | "Missed" | "No Answer"];
        }

        if (filters?.type && filters.type !== "all") {
            params.classifications = [filters.type.toLowerCase() as "business" | "personal" | "ignored"];
        }

        if (filters?.contactFilter && filters.contactFilter !== "all") {
            params.contact_filter = filters.contactFilter;
        }

        if (filters?.simSlot !== null && filters?.simSlot !== undefined) {
            params.sim_slot = filters.simSlot;
        }

        return params;
    }, [customer, dateFrom, dateTo, filters, page, perPage]);

    const { data, isLoading, isError } = useCallLogs(queryFilters, {
        enabled: open && !!customer,
    });

    const fullCallLogsUrl = useMemo(() => {
        if (!customer) return "/call-logs";
        const search = new URLSearchParams();
        search.set("search", customer.phone_number);
        if (dateFrom) search.set("start_date", dateFrom);
        if (dateTo) search.set("end_date", dateTo);
        if (filters?.outcome && filters.outcome !== "all") {
            search.set("outcomes[]", filters.outcome);
        }
        if (filters?.type && filters.type !== "all") {
            search.set("classifications[]", filters.type.toLowerCase());
        }
        if (filters?.contactFilter && filters.contactFilter !== "all") {
            search.set("contact_filter", filters.contactFilter);
        }
        if (filters?.simSlot !== null && filters?.simSlot !== undefined) {
            search.set("sim_slot", String(filters.simSlot));
        }
        return `/call-logs?${search.toString()}`;
    }, [customer, dateFrom, dateTo, filters]);

    const formattedDateRange = useMemo(() => {
        if (dateFrom && dateTo) {
            if (dateFrom === dateTo) {
                return dateFrom;
            }
            return `${dateFrom} to ${dateTo}`;
        }
        return "All Dates";
    }, [dateFrom, dateTo]);

    // Reset pagination when customer changes or dialog opens
    const handleOpenChange = (newOpen: boolean) => {
        if (newOpen) {
            setPage(1);
        }
        onOpenChange(newOpen);
    };

    if (!customer) return null;

    const callLogs = data?.data ?? [];
    const meta = data?.meta;
    const totalCalls = meta?.total ?? customer.total_calls;
    const totalPages = meta?.last_page ?? (Math.ceil(totalCalls / perPage) || 1);

    const getCallTypeIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case "incoming":
                return <PhoneIncoming className="h-4 w-4 text-emerald-500" />;
            case "outgoing":
                return <PhoneOutgoing className="h-4 w-4 text-blue-500" />;
            case "missed":
                return <PhoneMissed className="h-4 w-4 text-rose-500" />;
            case "rejected":
                return <PhoneOff className="h-4 w-4 text-amber-500" />;
            case "blocked":
                return <Ban className="h-4 w-4 text-zinc-500" />;
            default:
                return <HelpCircle className="h-4 w-4 text-zinc-400" />;
        }
    };

    const getOutcomeBadge = (outcome?: string) => {
        if (!outcome) return <span className="text-muted-foreground text-xs">—</span>;
        switch (outcome.toLowerCase()) {
            case "connected":
                return (
                    <Badge variant="outline" className="text-[11px] font-medium border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                        Connected
                    </Badge>
                );
            case "missed":
                return (
                    <Badge variant="outline" className="text-[11px] font-medium border-rose-200 text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                        Missed
                    </Badge>
                );
            case "no answer":
            case "no_answer":
                return (
                    <Badge variant="outline" className="text-[11px] font-medium border-amber-200 text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                        No Answer
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="text-[11px] font-medium text-zinc-600 border-zinc-200">
                        {outcome}
                    </Badge>
                );
        }
    };

    const formatCallTime = (dateStr?: string) => {
        if (!dateStr) return "—";
        try {
            const d = new Date(dateStr);
            return format(d, "MMM dd, yyyy · hh:mm a");
        } catch {
            return dateStr;
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden sm:rounded-2xl border border-zinc-200 dark:border-zinc-800">
                {/* Modal Header */}
                <DialogHeader className="p-5 pb-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-8">
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                                    Customer Details: {customer.customer_name}
                                </DialogTitle>
                                <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                                    {customer.phone_number}
                                </span>
                                <Badge
                                    variant="outline"
                                    className="text-xs font-medium border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800"
                                >
                                    {customer.organization}
                                </Badge>
                                <Badge
                                    variant="secondary"
                                    className="text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-none"
                                >
                                    Primary: {customer.primary_agent.name}
                                </Badge>
                            </div>
                            <DialogDescription className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-zinc-400" />
                                    {formattedDateRange}
                                </span>
                                {filters?.outcome && filters.outcome !== "all" && (
                                    <>
                                        <span>•</span>
                                        <span className="inline-flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300">
                                            Outcome: {filters.outcome}
                                        </span>
                                    </>
                                )}
                                {filters?.type && filters.type !== "all" && (
                                    <>
                                        <span>•</span>
                                        <span className="inline-flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300">
                                            Type: {filters.type}
                                        </span>
                                    </>
                                )}
                                {customer.last_call && (
                                    <>
                                        <span>•</span>
                                        <span>Last Call: {customer.last_call.time}</span>
                                    </>
                                )}
                            </DialogDescription>
                        </div>

                        <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-xs text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 self-start sm:self-auto shrink-0">
                            <Link href={fullCallLogsUrl} target="_blank">
                                <span>Open in Call Logs</span>
                                <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                        </Button>
                    </div>

                    {/* Quick Stats Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/80">
                        <div className="bg-white dark:bg-zinc-800/80 p-2.5 rounded-lg border border-zinc-200/70 dark:border-zinc-700/60 flex items-center justify-between">
                            <div>
                                <div className="text-[11px] text-muted-foreground">Total Calls</div>
                                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{customer.total_calls}</div>
                            </div>
                            <PhoneCall className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="bg-white dark:bg-zinc-800/80 p-2.5 rounded-lg border border-zinc-200/70 dark:border-zinc-700/60 flex items-center justify-between">
                            <div>
                                <div className="text-[11px] text-muted-foreground">Missed Calls</div>
                                <div className={`text-sm font-bold ${customer.missed_calls > 0 ? "text-rose-600 dark:text-rose-400" : "text-zinc-900 dark:text-zinc-100"}`}>
                                    {customer.missed_calls}
                                </div>
                            </div>
                            <PhoneMissed className={`h-4 w-4 ${customer.missed_calls > 0 ? "text-rose-500" : "text-zinc-400"}`} />
                        </div>
                        <div className="bg-white dark:bg-zinc-800/80 p-2.5 rounded-lg border border-zinc-200/70 dark:border-zinc-700/60 flex items-center justify-between">
                            <div>
                                <div className="text-[11px] text-muted-foreground">Total Duration</div>
                                <div className="text-sm font-bold text-purple-600 dark:text-purple-400">{customer.total_duration}</div>
                            </div>
                            <Clock className="h-4 w-4 text-purple-500" />
                        </div>
                        <div className="bg-white dark:bg-zinc-800/80 p-2.5 rounded-lg border border-zinc-200/70 dark:border-zinc-700/60 flex items-center justify-between">
                            <div>
                                <div className="text-[11px] text-muted-foreground">Avg Duration</div>
                                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{customer.avg_duration}</div>
                            </div>
                            <Hourglass className="h-4 w-4 text-amber-500" />
                        </div>
                    </div>

                    {/* Primary Agent & Last Call Strip */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-xs">
                        <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                            <UserCheck className="h-3.5 w-3.5 text-blue-500" />
                            <span>Primary Agent: <strong>{customer.primary_agent.name}</strong> ({customer.primary_agent.team})</span>
                        </div>
                        {customer.last_call && (
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                <span>Last Contact:</span>
                                <span className="font-medium text-zinc-800 dark:text-zinc-200">{customer.last_call.time}</span>
                                <span>·</span>
                                <span>{customer.last_call.is_missed ? "Missed" : `${customer.last_call.direction} (${customer.last_call.duration_formatted})`}</span>
                                <span>·</span>
                                <span>by {customer.last_call.agent_name}</span>
                            </div>
                        )}
                    </div>
                </DialogHeader>

                {/* Table Content */}
                <div className="flex-1 overflow-y-auto min-h-[280px]">
                    <Table>
                        <TableHeader className="bg-zinc-50 dark:bg-zinc-900/60 sticky top-0 z-10">
                            <TableRow className="border-b border-zinc-200 dark:border-zinc-800">
                                <TableHead className="w-12 text-xs font-semibold text-zinc-600 dark:text-zinc-400">Type</TableHead>
                                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Agent Handled</TableHead>
                                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 text-center">Outcome</TableHead>
                                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Duration</TableHead>
                                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Time</TableHead>
                                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">SIM</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <TableRow key={i} className="animate-pulse border-b border-zinc-100 dark:border-zinc-800">
                                        <TableCell><div className="h-4 w-6 rounded bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                        <TableCell><div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                        <TableCell><div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800 mx-auto" /></TableCell>
                                        <TableCell><div className="h-4 w-14 rounded bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                        <TableCell><div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                        <TableCell><div className="h-4 w-12 rounded bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                    </TableRow>
                                ))
                            ) : isError ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center text-sm text-rose-500">
                                        Failed to load call logs for this customer. Please try again.
                                    </TableCell>
                                </TableRow>
                            ) : callLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center text-sm text-muted-foreground">
                                        No calls found matching the current filter criteria for this customer.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                callLogs.map((log) => (
                                    <TableRow key={log.id} className="border-b border-zinc-100 dark:border-zinc-800/70 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                                        <TableCell className="py-2.5">
                                            <div className="flex items-center justify-center" title={log.call_type}>
                                                {getCallTypeIcon(log.call_type)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-2.5 font-medium text-xs text-zinc-900 dark:text-zinc-100">
                                            <div>{log.agent_name || "Unassigned Agent"}</div>
                                            {log.phone_contact_name && (
                                                <div className="text-[11px] font-normal text-muted-foreground">
                                                    Saved as: &quot;{log.phone_contact_name}&quot;
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center py-2.5">
                                            {getOutcomeBadge(log.call_outcome)}
                                        </TableCell>
                                        <TableCell className="text-xs text-zinc-700 dark:text-zinc-300 font-mono py-2.5">
                                            {formatDuration(log.duration)}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground py-2.5">
                                            {formatCallTime(log.timestamp)}
                                        </TableCell>
                                        <TableCell className="py-2.5">
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-zinc-200 text-zinc-600 dark:text-zinc-400 inline-flex items-center gap-1">
                                                <Smartphone className="h-3 w-3" />
                                                <span>SIM {log.sim_slot !== null && log.sim_slot !== undefined ? log.sim_slot + 1 : 1}</span>
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Modal Footer with Pagination */}
                <div className="p-3.5 px-5 border-t border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
                    <div>
                        Showing {callLogs.length > 0 ? (page - 1) * perPage + 1 : 0} to{" "}
                        {Math.min(page * perPage, totalCalls)} of {totalCalls} calls
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1 || isLoading}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="h-8 text-xs gap-1"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                            Previous
                        </Button>
                        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 px-1">
                            Page {page} of {Math.max(1, totalPages)}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages || isLoading}
                            onClick={() => setPage((p) => p + 1)}
                            className="h-8 text-xs gap-1"
                        >
                            Next
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="h-8 text-xs ml-2"
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
