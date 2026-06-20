import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@shared/components/ui/card";
import { PhoneMissed, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { EscalationSummary } from "../types/escalation";

interface MissedCallSummaryWidgetsProps {
    summary?: EscalationSummary;
    isLoading?: boolean;
}

export function MissedCallSummaryWidgets({ summary, isLoading }: MissedCallSummaryWidgetsProps) {
    const widgets = [
        {
            label: "Total Missed",
            icon: <PhoneMissed className="h-4 w-4 text-zinc-500" />,
            value: isLoading ? null : (
                <div className="flex items-baseline gap-1 leading-none">
                    <span className="text-2xl font-bold">{summary?.active_missed ?? 0}</span>
                    <span className="text-sm text-muted-foreground">/ {summary?.total_missed ?? 0}</span>
                </div>
            ),
        },
        {
            label: "Pending",
            icon: <Clock className="h-4 w-4 text-amber-500" />,
            value: isLoading ? null : (
                <div className="text-2xl font-bold">{summary?.pending ?? 0}</div>
            ),
        },
        {
            label: "Unattended",
            icon: <AlertCircle className="h-4 w-4 text-red-500" />,
            value: isLoading ? null : (
                <div className="text-2xl font-bold">{summary?.unattended ?? 0}</div>
            ),
        },
        {
            label: "Resolved",
            icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
            value: isLoading ? null : (
                <div className="text-2xl font-bold">{summary?.resolved ?? 0}</div>
            ),
        },
    ];

    return (
        <>
            {widgets.map(({ label, icon, value }) => (
                <Card key={label}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{label}</CardTitle>
                        {icon}
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-8 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                        ) : (
                            value
                        )}
                    </CardContent>
                </Card>
            ))}
        </>
    );
}
