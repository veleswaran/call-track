import { Phone, CheckCircle, XCircle, PhoneOff, Clock, LucideIcon } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card"
import { cn } from "@shared/utils"

interface SummaryMetric {
    label: string
    value: string
    percentage?: number
    icon?: string
    color?: string
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
    clock: Clock
}

export function ReportSummary({ metrics, isLoading }: ReportSummaryProps) {
    if (isLoading) {
        return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map(i => (
                <Card key={i} className="animate-pulse h-24" />
            ))}
        </div>
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {metrics.map((metric, index) => {
                const Icon = iconMap[metric.icon || 'phone'] || Phone
                return (
                    <Card key={index}>
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
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
