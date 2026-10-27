"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@shared/components/ui/dialog";
import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import {
    Clock,
    User,
    UserCheck,
    PhoneIncoming,
    PhoneOutgoing,
    Calendar,
    ShieldCheck,
    ExternalLink,
} from "lucide-react";
import { LongestCall, CallInsightsFiltersData } from "../types";

export interface LongestCallDetailsDialogProps {
    call: LongestCall | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters?: CallInsightsFiltersData;
    dateFrom?: string;
    dateTo?: string;
}

export function LongestCallDetailsDialog({
    call,
    open,
    onOpenChange,
    dateFrom,
    dateTo,
}: LongestCallDetailsDialogProps) {
    const isOutgoing = call?.direction === "OUTGOING";

    const customerLogsUrl = useMemo(() => {
        if (!call) return "/call-logs";
        const search = new URLSearchParams();
        if (call.phone_number) {
            // Strip formatting if any, or pass phone
            search.set("search", call.phone_number);
        }
        if (dateFrom) search.set("start_date", dateFrom);
        if (dateTo) search.set("end_date", dateTo);
        return `/call-logs?${search.toString()}`;
    }, [call, dateFrom, dateTo]);

    if (!call) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl p-0 overflow-hidden sm:rounded-2xl border border-zinc-200 dark:border-zinc-800">
                {/* Header */}
                <DialogHeader className="p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="flex items-center justify-between gap-3 pr-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                                    Call Audit Details
                                </DialogTitle>
                                <span className="text-xs text-muted-foreground font-mono">
                                    #{call.id}
                                </span>
                            </div>
                            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                High duration engagement review and talk-time outlier inspection
                            </DialogDescription>
                        </div>

                        <Badge
                            variant="secondary"
                            className="bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800 font-bold text-xs px-2.5 py-1"
                        >
                            {call.duration}
                        </Badge>
                    </div>
                </DialogHeader>

                {/* Body Content */}
                <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                    {/* Key Metrics Spotlight */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {/* Duration Card */}
                        <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
                            <div className="flex items-center gap-1.5 text-xs text-purple-700 dark:text-purple-300 font-medium">
                                <Clock className="h-3.5 w-3.5" />
                                <span>Talk Time</span>
                            </div>
                            <div className="text-base font-bold text-purple-900 dark:text-purple-100 mt-1">
                                {call.duration}
                            </div>
                            <div className="text-[11px] text-purple-600 dark:text-purple-400 font-mono mt-0.5">
                                {call.duration_raw}s total
                            </div>
                        </div>

                        {/* Direction Card */}
                        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                {isOutgoing ? (
                                    <PhoneOutgoing className="h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                    <PhoneIncoming className="h-3.5 w-3.5 text-blue-500" />
                                )}
                                <span>Direction</span>
                            </div>
                            <div className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-1 capitalize">
                                {call.direction.toLowerCase()}
                            </div>
                            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                                Connected
                            </div>
                        </div>

                        {/* Classification Card */}
                        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60 col-span-2 sm:col-span-1">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                                <span>Classification</span>
                            </div>
                            <div className="mt-1">
                                <Badge
                                    variant="outline"
                                    className={`text-xs font-semibold uppercase ${
                                        call.classification === "BUSINESS"
                                            ? "border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-950 dark:text-blue-300"
                                            : "border-amber-200 text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-300"
                                    }`}
                                >
                                    {call.classification}
                                </Badge>
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                                Official Record
                            </div>
                        </div>
                    </div>

                    {/* Participants Section */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Participants & Routing
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Customer Profile */}
                            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-2">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <User className="h-3.5 w-3.5 text-zinc-400" />
                                    <span>Customer / Contact</span>
                                </div>
                                <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                                    {call.customer_name}
                                </div>
                                <div className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                                    {call.phone_number}
                                </div>
                            </div>

                            {/* Agent Profile */}
                            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-2">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <UserCheck className="h-3.5 w-3.5 text-blue-500" />
                                    <span>Handled by Agent</span>
                                </div>
                                <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                                    {call.agent}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="font-mono uppercase">{call.employee_code}</span>
                                    <span>•</span>
                                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{call.team}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timestamp & Timing */}
                    <div className="p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4 text-zinc-400" />
                            <span>Recorded Timestamp</span>
                        </div>
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {call.timestamp}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <Link
                        href={customerLogsUrl}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                    >
                        Search Customer in Call Logs
                        <ExternalLink className="h-3.5 w-3.5" />
                    </Link>

                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="h-8 text-xs self-end sm:self-auto"
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
