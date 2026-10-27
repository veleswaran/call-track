import { Users, PhoneCall, Clock, PhoneMissed } from "lucide-react";
import { Badge } from "@shared/components/ui/badge";
import { useSettingsQuery } from "@features/settings/hooks/use-settings";
import { CustomerSummaryMetrics as MetricsType } from "../types";

interface CustomerSummaryMetricsProps {
    metrics: MetricsType | null;
    isLoading?: boolean;
}

export function CustomerSummaryMetrics({ metrics, isLoading }: CustomerSummaryMetricsProps) {
    const { data: settings } = useSettingsQuery();
    const slaHours = settings?.escalation_sla_hours;

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-28 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 animate-pulse"
                    />
                ))}
            </div>
        );
    }

    const {
        total_accounts = 0,
        total_calls = 0,
        connected_calls = 0,
        connected_pct = 0,
        total_talk_time = "0m",
        missed_calls = 0,
        pending_missed_calls,
        sla_pending_count = 0,
        auto_resolved_count = 0,
    } = metrics || {};

    const activePendingMissed = pending_missed_calls !== undefined
        ? pending_missed_calls
        : sla_pending_count;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Accounts Logged */}
            <div className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium text-zinc-600 dark:text-zinc-400">Total Accounts Logged</span>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Users className="h-4 w-4" />
                    </div>
                </div>
                <div className="my-2">
                    <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                        {total_accounts.toLocaleString()}
                    </div>
                </div>
                <div className="text-xs text-muted-foreground">
                    Unique phone identities
                </div>
            </div>

            {/* 2. Customer Calls Handled */}
            <div className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium text-zinc-600 dark:text-zinc-400">Customer Calls Handled</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <PhoneCall className="h-4 w-4" />
                    </div>
                </div>
                <div className="my-2">
                    <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                        {total_calls.toLocaleString()}
                    </div>
                </div>
                <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {connected_calls.toLocaleString()} Connected ({connected_pct}%)
                </div>
            </div>

            {/* 3. Total Customer Talk-Time */}
            <div className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium text-zinc-600 dark:text-zinc-400">Total Customer Talk-Time</span>
                    <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <Clock className="h-4 w-4" />
                    </div>
                </div>
                <div className="my-2">
                    <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                        {total_talk_time}
                    </div>
                </div>
                <div className="text-xs text-muted-foreground">
                    Across official SIM slots
                </div>
            </div>

            {/* 4. Missed Call Touchpoints */}
            <div className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium text-zinc-600 dark:text-zinc-400">
                        Missed Calls
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <PhoneMissed className="h-4 w-4" />
                    </div>
                </div>
                <div className="my-2 flex items-baseline justify-between gap-2 flex-wrap">
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                            {activePendingMissed.toLocaleString()}
                        </span>
                        <span className="text-xs text-zinc-500 font-medium">
                            {" "}/ {missed_calls.toLocaleString()}
                        </span>
                    </div>
                    {activePendingMissed > 0 && (
                        <Badge variant="destructive" className="text-[10px] uppercase font-bold px-1.5 py-0 bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            {activePendingMissed} Pending
                        </Badge>
                    )}
                </div>
                <div className="text-xs text-muted-foreground">
                    {auto_resolved_count > 0
                        ? `${auto_resolved_count.toLocaleString()} Auto-Resolved${slaHours ? ` (within ${slaHours}h)` : ""}`
                        : "Tracked SLA events"}
                </div>
            </div>
        </div>
    );
}
