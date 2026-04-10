import { Phone, CheckCircle, XCircle, PhoneOff, Clock, Users, LucideIcon } from "lucide-react"
import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card"
import { cn } from "@shared/utils"
import { MissedCallMetricCard } from "@features/missed-calls/components/MissedCallMetricCard"

interface SummaryMetric {
    label: string
    value: string
    percentage?: number
    icon?: string
    color?: string
    sub_metrics?: { label: string; value: number | string; color: string }[]
}

interface ReportSummaryProps {
    metrics: SummaryMetric[]
    isLoading?: boolean
}

const iconMap: Record<string, LucideIcon> = {
    phone: Phone,
    'check-circle': CheckCircle,
    'x-circle': XCircle,
    'phone-off': PhoneOff,
    clock: Clock,
    users: Users
}

const hrefMap: Record<string, string> = {
    "total calls": "/call-logs",
    "missed calls": "/reports/missed-calls",
    "avg call duration": "/reports",
    "total duration": "/reports",
    "total agents": "/agents",
    "agents": "/agents",
}

export function ReportSummary({ metrics, isLoading }: ReportSummaryProps) {
    if (isLoading) {
        return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="animate-pulse h-24" />
            ))}
        </div>
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {metrics.map((metric, index) => {
                const normalizedLabel = metric.label.toLowerCase();
                const href = hrefMap[normalizedLabel];

                // If it's a Missed Calls metric with our expected sub-metrics, use the specialized card
                if (metric.label === "Missed Calls" && metric.sub_metrics) {
                    const getSubMetric = (labels: string[]) => Number(metric.sub_metrics?.find(s => labels.includes(s.label))?.value ?? 0);
                    const unattended = getSubMetric(['U', 'Unattended']);
                    const pending = getSubMetric(['P', 'Pending']);
                    const resolved = getSubMetric(['R', 'Resolved']);
                    const grandTotal = getSubMetric(['T', 'Total']);

                    return (
                        <MissedCallMetricCard
                            key={index}
                            title={metric.label}
                            total={Number(metric.value.toString().replace(/,/g, ''))}
                            grandTotal={grandTotal}
                            pending={pending}
                            unattended={unattended}
                            resolved={resolved}
                            changePercent={metric.percentage}
                            isLoading={isLoading}
                            href={href}
                        />
                    );
                }

                const Icon = iconMap[metric.icon || 'phone'] || Phone
                const cardContent = (
                    <Card key={index} className={cn(href && "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer")}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {metric.label}
                            </CardTitle>
                            <Icon className={cn("h-4 w-4 text-muted-foreground", metric.color)} />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="text-2xl font-bold">{metric.value}</div>
                                {metric.percentage !== undefined && (
                                    <div className={cn("text-xs font-bold px-2 py-0.5 rounded",
                                        metric.color ? `bg-opacity-10 ${metric.color.replace('text-', 'bg-').replace('500', '100')} ${metric.color}` : 'text-muted-foreground'
                                    )}>
                                        {metric.percentage}%
                                    </div>
                                )}
                            </div>
                            {metric.sub_metrics && metric.sub_metrics.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                    <div className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                                        {metric.sub_metrics.map((sub, i) => (
                                            <div key={i} className="flex items-center gap-1.5">
                                                <span className={cn("w-1.5 h-1.5 rounded-full", sub.color)} />
                                                <span>{sub.label}: {sub.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );

                if (href) {
                    return <Link key={index} href={href}>{cardContent}</Link>;
                }

                return cardContent;
            })}
        </div>
    )
}
