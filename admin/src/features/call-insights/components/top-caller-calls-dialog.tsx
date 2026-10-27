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
    CheckCircle2,
    XCircle,
    Smartphone,
} from "lucide-react";
import { useCallLogs, CallLogFilters } from "@features/call-logs/hooks/use-call-logs";
import { formatDuration } from "@shared/utils/time";
import { TopCaller, CallInsightsFiltersData } from "../types";

export interface TopCallerCallsDialogProps {
    caller: TopCaller | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters?: CallInsightsFiltersData;
    dateFrom?: string;
    dateTo?: string;
}

export function TopCallerCallsDialog({
    caller,
    open,
    onOpenChange,
    filters,
    dateFrom,
    dateTo,
}: TopCallerCallsDialogProps) {
    const [page, setPage] = useState(1);
    const perPage = 15;

    // Build scoped query filters matching current Call Insights filter criteria
    const queryFilters: CallLogFilters = useMemo(() => {
        if (!caller) return {};

        const params: CallLogFilters = {
            agents: [caller.id],
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
    }, [caller, dateFrom, dateTo, filters, page, perPage]);

    const { data, isLoading, isError } = useCallLogs(queryFilters, {
        enabled: open && !!caller,
    });

    // Build URL to the full call logs page with all parameters intact
    const fullCallLogsUrl = useMemo(() => {
        if (!caller) return "/call-logs";
        const search = new URLSearchParams();
        search.set("agents[]", String(caller.id));
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
    }, [caller, dateFrom, dateTo, filters]);

    const formattedDateRange = useMemo(() => {
        if (dateFrom && dateTo) {
            if (dateFrom === dateTo) {
                return dateFrom;
            }
            return `${dateFrom} to ${dateTo}`;
        }
        return "All Dates";
    }, [dateFrom, dateTo]);

    // Reset pagination when caller changes or dialog opens
    const handleOpenChange = (newOpen: boolean) => {
        if (newOpen) {
            setPage(1);
        }
        onOpenChange(newOpen);
    };

    if (!caller) return null;

    const callLogs = data?.data ?? [];
    const meta = data?.meta;
    const totalCalls = meta?.total ?? caller.total_calls;
    const totalPages = meta?.last_page ?? (Math.ceil(totalCalls / perPage) || 1);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden sm:rounded-2xl">
                {/* Modal Header */}
                <DialogHeader className="p-5 pb-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-8">
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                                    Calls Handled by {caller.agent}
                                </DialogTitle>
                                <Badge variant="outline" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    {caller.employee_code}
                                </Badge>
                                <Badge variant="secondary" className="text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-none">
                                    {caller.team}
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
                            </DialogDescription>
                        </div>
                    </div>

                    {/* Quick KPI Overview Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/80">
                        <div className="bg-white dark:bg-zinc-800/80 p-2.5 rounded-lg border border-zinc-200/70 dark:border-zinc-700/60 flex items-center justify-between">
                            <div>
                                <div className="text-[11px] text-muted-foreground">Total Calls</div>
                                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{caller.total_calls}</div>
                            </div>
                            <PhoneCall className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="bg-white dark:bg-zinc-800/80 p-2.5 rounded-lg border border-zinc-200/70 dark:border-zinc-700/60 flex items-center justify-between">
                            <div>
                                <div className="text-[11px] text-muted-foreground">Connected</div>
                                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{caller.connected}</div>
                            </div>
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="bg-white dark:bg-zinc-800/80 p-2.5 rounded-lg border border-zinc-200/70 dark:border-zinc-700/60 flex items-center justify-between">
                            <div>
                                <div className="text-[11px] text-muted-foreground">Missed</div>
                                <div className="text-sm font-bold text-rose-600 dark:text-rose-400">{caller.missed}</div>
                            </div>
                            <XCircle className="h-4 w-4 text-rose-500" />
                        </div>
                        <div className="bg-white dark:bg-zinc-800/80 p-2.5 rounded-lg border border-zinc-200/70 dark:border-zinc-700/60 flex items-center justify-between">
                            <div>
                                <div className="text-[11px] text-muted-foreground">Total Talk Time</div>
                                <div className="text-sm font-bold text-purple-600 dark:text-purple-400">{caller.total_duration}</div>
                            </div>
                            <Clock className="h-4 w-4 text-purple-500" />
                        </div>
                    </div>
                </DialogHeader>

                {/* Table Content */}
                <div className="flex-1 overflow-y-auto min-h-[280px]">
                    <Table>
                        <TableHeader className="bg-zinc-50 dark:bg-zinc-900/60 sticky top-0 z-10">
                            <TableRow className="border-b border-zinc-200 dark:border-zinc-800">
                                <TableHead className="w-12 text-xs font-semibold text-zinc-600 dark:text-zinc-400">Type</TableHead>
                                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Customer / Number</TableHead>
                                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 text-center">Outcome</TableHead>
                                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Duration</TableHead>
                                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Time</TableHead>
                                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">SIM</TableHead>
                                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 text-right">Class</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <TableRow key={i} className="animate-pulse border-b border-zinc-100 dark:border-zinc-800/60">
                                        <TableCell><div className="h-4 w-4 rounded-full bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                        <TableCell><div className="h-4 w-36 rounded bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                        <TableCell><div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800 mx-auto" /></TableCell>
                                        <TableCell><div className="h-4 w-12 rounded bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                        <TableCell><div className="h-4 w-28 rounded bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                        <TableCell><div className="h-4 w-10 rounded bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                        <TableCell><div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : isError ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center text-sm text-rose-500 font-medium">
                                        Failed to load call logs. Please try again.
                                    </TableCell>
                                </TableRow>
                            ) : callLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-36 text-center text-xs text-muted-foreground">
                                        No call logs found for this agent matching the current filter.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                callLogs.map((log) => {
                                    return (
                                        <TableRow
                                            key={log.id}
                                            className="border-b border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 text-xs"
                                        >
                                            {/* Type Icon */}
                                            <TableCell className="w-12">
                                                {log.call_type === "incoming" && (
                                                    <span title="Incoming" className="inline-flex p-1 rounded bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                                                        <PhoneIncoming className="h-3.5 w-3.5" />
                                                    </span>
                                                )}
                                                {log.call_type === "outgoing" && (
                                                    <span title="Outgoing" className="inline-flex p-1 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                                                        <PhoneOutgoing className="h-3.5 w-3.5" />
                                                    </span>
                                                )}
                                                {log.call_type === "missed" && (
                                                    <span title="Missed" className="inline-flex p-1 rounded bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                                                        <PhoneMissed className="h-3.5 w-3.5" />
                                                    </span>
                                                )}
                                                {log.call_type === "rejected" && (
                                                    <span title="Rejected" className="inline-flex p-1 rounded bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
                                                        <PhoneOff className="h-3.5 w-3.5" />
                                                    </span>
                                                )}
                                                {log.call_type === "blocked" && (
                                                    <span title="Blocked" className="inline-flex p-1 rounded bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                                        <Ban className="h-3.5 w-3.5" />
                                                    </span>
                                                )}
                                                {log.call_type === "unknown" && (
                                                    <span title="Unknown" className="inline-flex p-1 rounded bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                                        <HelpCircle className="h-3.5 w-3.5" />
                                                    </span>
                                                )}
                                            </TableCell>

                                            {/* Contact & Phone Number */}
                                            <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                                                {log.contact_name ? (
                                                    <div>
                                                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">{log.contact_name}</div>
                                                        <div className="text-[11px] font-mono text-muted-foreground">{log.phone_number}</div>
                                                    </div>
                                                ) : log.phone_contact_name ? (
                                                    <div>
                                                        <div className="font-medium text-zinc-800 dark:text-zinc-200">{log.phone_contact_name}</div>
                                                        <div className="text-[11px] font-mono text-muted-foreground">{log.phone_number}</div>
                                                    </div>
                                                ) : (
                                                    <div className="font-mono text-xs">{log.phone_number}</div>
                                                )}
                                            </TableCell>

                                            {/* Outcome */}
                                            <TableCell className="text-center">
                                                <Badge
                                                    variant="secondary"
                                                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                                        log.call_outcome === "Connected"
                                                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                                            : log.call_outcome === "Missed"
                                                            ? "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                                            : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                                    }`}
                                                >
                                                    {log.call_outcome}
                                                </Badge>
                                            </TableCell>

                                            {/* Duration */}
                                            <TableCell className="font-medium text-zinc-700 dark:text-zinc-300">
                                                {formatDuration(log.duration)}
                                            </TableCell>

                                            {/* Timestamp */}
                                            <TableCell className="text-muted-foreground text-[11px] whitespace-nowrap">
                                                {format(new Date(log.timestamp), "MMM d, h:mm a")}
                                            </TableCell>

                                            {/* SIM Slot */}
                                            <TableCell className="text-zinc-600 dark:text-zinc-400 text-[11px]">
                                                {log.sim_slot !== null && log.sim_slot !== undefined ? (
                                                    <span className="inline-flex items-center gap-0.5">
                                                        <Smartphone className="h-3 w-3 text-zinc-400" />
                                                        SIM {log.sim_slot + 1}
                                                    </span>
                                                ) : (
                                                    "-"
                                                )}
                                            </TableCell>

                                            {/* Classification */}
                                            <TableCell className="text-right">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] font-medium capitalize border-none ${
                                                        log.classification?.classification === "personal"
                                                            ? "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                                                            : log.classification?.classification === "ignored"
                                                            ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                                                            : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                                    }`}
                                                >
                                                    {log.classification?.classification || "business"}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs text-muted-foreground">
                        {meta ? (
                            <>
                                Showing <span className="font-semibold text-zinc-900 dark:text-zinc-100">{meta.from || 0}</span> to{" "}
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{meta.to || 0}</span> of{" "}
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{meta.total}</span> calls
                            </>
                        ) : (
                            <span>{callLogs.length} calls loaded</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        <Link
                            href={fullCallLogsUrl}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline mr-2"
                        >
                            Open in Full Call Logs
                            <ExternalLink className="h-3.5 w-3.5" />
                        </Link>

                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1 || isLoading}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="h-8 text-xs"
                        >
                            <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                            Prev
                        </Button>
                        <span className="text-xs text-muted-foreground px-1">
                            {page} / {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages || isLoading}
                            onClick={() => setPage((p) => p + 1)}
                            className="h-8 text-xs"
                        >
                            Next
                            <ChevronRight className="h-3.5 w-3.5 ml-1" />
                        </Button>

                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenChange(false)}
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
