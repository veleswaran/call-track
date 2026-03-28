import { PhoneMissed } from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@shared/components/ui/card";
import { cn } from "@shared/utils";

interface MissedCallMetricCardProps {
    title?: string;
    total: number; // Unattended + Pending missed calls
    grandTotal?: number; // Overall total missed calls
    pending: number;
    unattended: number;
    resolved: number;
    changePercent?: number | null;
    isLoading?: boolean;
    className?: string;
}

/**
 * Revised metric card showing Pending / Total Missed Call split.
 */
export function MissedCallMetricCard({
    title = "Missed Calls",
    total,
    grandTotal = total,
    pending, // Future use case
    unattended, // Future use case
    resolved,
    changePercent,
    isLoading = false,
    className,
}: MissedCallMetricCardProps) {
    return (
        <Card className={cn("overflow-hidden h-full", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <PhoneMissed className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                ) : (
                    <div className="flex flex-col">
                        <div className="flex items-baseline justify-between transition-all">
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold tracking-tight">{total.toLocaleString()}</span>
                                <span className="text-xs text-zinc-500 font-medium">/ {grandTotal}</span>
                            </div>

                            {/* Commented out for future use */}
                            <div className="flex gap-2 text-[15px] font-bold uppercase tracking-tighter">
                                {/* <span className="text-red-500">U:{unattended}</span>
                                <span className="text-amber-500 border-l border-zinc-100 dark:border-zinc-800 pl-2">P:{pending}</span> */}
                                <span className="text-emerald-500 border-zinc-100 dark:border-zinc-800 pl-2">R:{resolved}</span>
                            </div>
                        </div>

                        {changePercent !== undefined && changePercent !== null && (
                            <div className={cn(
                                "flex items-center gap-1 text-[11px] font-medium transition-colors",
                                changePercent >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                            )}>
                                <span>{changePercent >= 0 ? "↑" : "↓"} {Math.abs(changePercent)}%</span>
                                <span className="text-zinc-500 dark:text-zinc-400 font-normal">vs last week</span>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
