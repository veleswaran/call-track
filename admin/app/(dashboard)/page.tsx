import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@shared/components/ui/card";
import { Phone, PhoneIncoming, PhoneOutgoing, Clock } from "lucide-react";

/**
 * Metric card component for dashboard
 */
function MetricCard({
    title,
    value,
    icon: Icon,
    description,
}: {
    title: string;
    value: string | number;
    icon: typeof Phone;
    description?: string;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * Dashboard page - displays key metrics and summary
 */
export default function DashboardPage() {
    // Placeholder data - will be replaced with API data
    const metrics = {
        totalCalls: 1234,
        businessCalls: 892,
        personalCalls: 245,
        totalDuration: "48h 32m",
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-zinc-500 dark:text-zinc-400">
                    Overview of your call tracking metrics
                </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Total Calls"
                    value={metrics.totalCalls.toLocaleString()}
                    icon={Phone}
                    description="All time"
                />
                <MetricCard
                    title="Business Calls"
                    value={metrics.businessCalls.toLocaleString()}
                    icon={PhoneIncoming}
                    description="Classified as business"
                />
                <MetricCard
                    title="Personal Calls"
                    value={metrics.personalCalls.toLocaleString()}
                    icon={PhoneOutgoing}
                    description="Classified as personal"
                />
                <MetricCard
                    title="Total Duration"
                    value={metrics.totalDuration}
                    icon={Clock}
                    description="Combined call time"
                />
            </div>

            {/* Placeholder for future content */}
            <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
                <p className="text-zinc-500 dark:text-zinc-400">
                    Additional dashboard widgets will appear here
                </p>
            </div>
        </div>
    );
}
