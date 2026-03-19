"use client";

import { PhoneMissed, Info } from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@shared/components/ui/card";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@shared/components/ui/tooltip";
import { cn } from "@shared/utils";

interface MissedCallMetricCardProps {
    title?: string;
    total: number;
    pending: number;
    unattended: number;
    resolved: number;
    changePercent?: number | null;
    isLoading?: boolean;
    className?: string;
}

/**
 * Reusable metric card for Missed Calls that displays sub-metrics in a tooltip.
 */
export function MissedCallMetricCard({
    title = "Missed Calls",
    total,
    pending,
    unattended,
    resolved,
    changePercent,
    isLoading = false,
    className,
}: MissedCallMetricCardProps) {
    return (
        <Card className={cn(className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <PhoneMissed className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="h-8 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                ) : (
                    <div className="flex items-baseline gap-2">
                        <div className="text-2xl font-bold">{total.toLocaleString()}</div>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                                        <Info className="h-3.5 w-3.5" />
                                        <span className="sr-only">View status breakdown</span>
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent className="p-3 min-w-[140px]">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                                            Status Breakdown
                                        </p>
                                        {[
                                            { label: "Unattended", value: unattended, color: "bg-red-500" },
                                            { label: "Pending", value: pending, color: "bg-amber-500" },
                                            { label: "Resolved", value: resolved, color: "bg-emerald-500" },
                                            ].map((status) => (
                                            <div key={status.label} className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn("w-2 h-2 rounded-full", status.color)} />
                                                    <span className="text-xs">{status.label}</span>
                                                </div>
                                                <span className="text-xs font-bold">{status.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                )}
                
                {changePercent !== undefined && !isLoading && changePercent !== null && (
                    <div className={cn(
                        "flex items-center gap-1 mt-1 text-xs",
                        changePercent >= 0 ? "text-emerald-600" : "text-red-600"
                    )}>
                        <span>{changePercent >= 0 ? "+" : ""}{changePercent}%</span>
                        <span className="text-zinc-500">vs last period</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
