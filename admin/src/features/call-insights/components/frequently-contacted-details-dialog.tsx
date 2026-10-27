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
    Smartphone,
    User,
    Users,
    ArrowDownLeft,
    ArrowUpRight,
} from "lucide-react";
import { useCallLogs, CallLogFilters } from "@features/call-logs/hooks/use-call-logs";
import { formatDuration } from "@shared/utils/time";
import { FrequentlyContacted, CallInsightsFiltersData } from "../types";

export interface FrequentlyContactedDetailsDialogProps {
    customer: FrequentlyContacted | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters?: CallInsightsFiltersData;
    dateFrom?: string;
    dateTo?: string;
}

function safeFormatTimestamp(timestamp?: string | null): string {
    if (!timestamp) return "-";
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? "-" : format(date, "MMM d, h:mm a");
}

export function FrequentlyContactedDetailsDialog({
    customer,
    open,
    onOpenChange,
    filters,
    dateFrom,
    dateTo,
}: FrequentlyContactedDetailsDialogProps) {
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

    // Group agent contact names by customer name
    const groupedContactNames = useMemo<{ contact_name: string; agents: string[] }[]>(() => {
        if (!customer?.agent_contacts || customer.agent_contacts.length === 0) return [];
        const map = new Map<string, string[]>();
        for (const ac of customer.agent_contacts) {
            const name = ac.contact_name?.trim();
            if (!name) continue;
            const list = map.get(name) || [];
            list.push(ac.agent_name);
            map.set(name, list);
        }
        return Array.from(map.entries())
            .map(([contact_name, agents]) => ({ contact_name, agents }))
            .sort((a, b) => b.agents.length - a.agents.length);
    }, [customer]);

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
    const totalCalls = meta?.total ?? customer.total_touchpoints;
    const totalPages = meta?.last_page ?? (Math.ceil(totalCalls / perPage) || 1);

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
                                    {customer.account_category}
                                </Badge>
                            </div>
                            <DialogDescription className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-zinc-400" />
                                    {formattedDateRange}
                                </span>
                                <span>•</span>
                                <span>Last contacted {customer.last_contacted}</span>
                            </DialogDescription>
                        </div>
                    </div>

                    {/* Quick Stats Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/80">
                        <div className="bg-white dark:bg-zinc-800/80 p-2.5 rounded-lg border border-zinc-200/70 dark:border-zinc-700/60 flex items-center justify-between">
                            <div>
                                <div className="text-[11px] text-muted-foreground">Touchpoints</div>
                                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{customer.total_touchpoints}</div>
                            </div>
                            <PhoneCall className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="bg-white dark:bg-zinc-800/80 p-2.5 rounded-lg border border-zinc-200/70 dark:border-zinc-700/60 flex items-center justify-between">
                            <div>
                                <div className="text-[11px] text-muted-foreground">In / Out Ratio</div>
                                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                    <span className="text-blue-600 dark:text-blue-400">{customer.in_count} In</span> / <span className="text-emerald-600 dark:text-emerald-400">{customer.out_count} Out</span>
                                </div>
                            </div>
                            <div className="flex gap-0.5 text-zinc-400">
                                <ArrowDownLeft className="h-3.5 w-3.5 text-blue-500" />
                                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                            </div>
                        </div>
                        <div className="bg-white dark:bg-zinc-800/80 p-2.5 rounded-lg border border-zinc-200/70 dark:border-zinc-700/60 flex items-center justify-between">
                            <div>
                                <div className="text-[11px] text-muted-foreground">Total Talk Time</div>
                                <div className="text-sm font-bold text-purple-600 dark:text-purple-400">{customer.total_talk_time}</div>
                            </div>
                            <Clock className="h-4 w-4 text-purple-500" />
                        </div>
                        <div className="bg-white dark:bg-zinc-800/80 p-2.5 rounded-lg border border-zinc-200/70 dark:border-zinc-700/60 flex items-center justify-between">
                            <div>
                                <div className="text-[11px] text-muted-foreground">Agents Handled</div>
                                <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[130px]" title={customer.agents_handled}>
                                    {customer.agents_handled}
                                </div>
                            </div>
                            <Users className="h-4 w-4 text-zinc-400" />
                        </div>
                    </div>

                    {/* Agent Phonebook Variations Banner (Grouped by Customer Name) */}
                    {groupedContactNames.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/80">
                            <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-1.5">
                                <User className="h-3 w-3 text-blue-500" />
                                <span>Agent Phonebook Names (Grouped by Customer Name):</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {groupedContactNames.map((g, idx) => (
                                    <div
                                        key={idx}
                                        className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/60 text-xs shadow-2xs"
                                    >
                                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                            &quot;{g.contact_name}&quot;
                                        </span>
                                        <span className="text-[11px] text-muted-foreground border-l border-zinc-200 dark:border-zinc-700 pl-2">
                                            {g.agents.length === 1 ? (
                                                <span>Saved by <strong className="text-zinc-800 dark:text-zinc-200 font-medium">{g.agents[0]}</strong></span>
                                            ) : (
                                                <span title={g.agents.join(", ")}>
                                                    Saved by <strong className="text-zinc-800 dark:text-zinc-200 font-medium">{g.agents.length} agents</strong> ({g.agents.slice(0, 2).join(", ")}{g.agents.length > 2 ? ` +${g.agents.length - 2} more` : ""})
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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
                                <TableHead className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 text-right">Class</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <TableRow key={i} className="animate-pulse border-b border-zinc-100 dark:border-zinc-800/60">
                                        <TableCell><div className="h-4 w-4 rounded-full bg-zinc-200 dark:bg-zinc-800" /></TableCell>
                                        <TableCell><div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" /></TableCell>
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
                                        Failed to load customer call logs. Please try again.
                                    </TableCell>
                                </TableRow>
                            ) : callLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-36 text-center text-xs text-muted-foreground">
                                        No individual call records found matching this customer under the current filter.
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

                                            {/* Agent Handled */}
                                            <TableCell className="font-semibold text-zinc-900 dark:text-zinc-100">
                                                <div>{log.agent_name || "Unassigned Agent"}</div>
                                                {log.phone_contact_name && (
                                                    <div className="text-[11px] font-normal text-muted-foreground">
                                                        Saved as: <span className="text-zinc-700 dark:text-zinc-300 font-medium">&quot;{log.phone_contact_name}&quot;</span>
                                                    </div>
                                                )}
                                                {log.device_name && !log.phone_contact_name && (
                                                    <div className="text-[11px] font-normal text-muted-foreground">{log.device_name}</div>
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
                                                {safeFormatTimestamp(log.timestamp)}
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
