"use client";

import type { DeviceEvent } from "@shared/types";
import { formatDistanceToNow } from "date-fns";
import {
    XCircle,
    Shield,
    ShieldCheck,
    Battery,
    RefreshCw,
    Clock,
    AlertTriangle,
    Smartphone,
    Power,
    Ban,
} from "lucide-react";

interface DeviceEventsTimelineProps {
    events: DeviceEvent[];
    isLoading?: boolean;
}

const EVENT_CONFIG: Record<
    string,
    { icon: React.ElementType; color: string; label: string }
> = {
    APP_STOPPED: {
        icon: Power,
        color: "text-amber-500",
        label: "App Stopped",
    },
    APP_DEREGISTERED: {
        icon: XCircle,
        color: "text-red-500",
        label: "App Deregistered",
    },
    APP_UNINSTALLED: {
        icon: Ban,
        color: "text-red-600",
        label: "App Uninstalled",
    },
    PERMISSION_DENIED: {
        icon: Shield,
        color: "text-orange-500",
        label: "Permission Denied",
    },
    PERMISSION_GRANTED: {
        icon: ShieldCheck,
        color: "text-green-500",
        label: "Permission Granted",
    },
    BATTERY_OPTIMIZATION_ENABLED: {
        icon: Battery,
        color: "text-yellow-500",
        label: "Battery Optimization Enabled",
    },
    FOREGROUND_SERVICE_BLOCKED: {
        icon: AlertTriangle,
        color: "text-orange-600",
        label: "Foreground Service Blocked",
    },
    DEVICE_REBOOTED: {
        icon: RefreshCw,
        color: "text-blue-500",
        label: "Device Rebooted",
    },
    TOKEN_EXPIRED: {
        icon: Clock,
        color: "text-gray-500",
        label: "Token Expired",
    },
    CALL_LOG_ACCESS_FAILED: {
        icon: AlertTriangle,
        color: "text-red-400",
        label: "Call Log Access Failed",
    },
};

function getEventConfig(eventType: string) {
    return (
        EVENT_CONFIG[eventType] ?? {
            icon: Smartphone,
            color: "text-gray-400",
            label: eventType.replace(/_/g, " "),
        }
    );
}

export function DeviceEventsTimeline({
    events,
    isLoading,
}: DeviceEventsTimelineProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="py-8 text-center text-zinc-500">
                No events recorded yet
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-zinc-200 dark:bg-zinc-700" />

            <div className="space-y-4">
                {events.map((event) => {
                    const config = getEventConfig(event.event_type);
                    const Icon = config.icon;

                    return (
                        <div key={event.id} className="relative flex gap-4 pl-10">
                            {/* Icon circle */}
                            <div
                                className={`absolute left-2 -translate-x-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-zinc-900 ring-2 ring-zinc-200 dark:ring-zinc-700`}
                            >
                                <Icon className={`h-3 w-3 ${config.color}`} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <span
                                            className={`font-medium ${config.color}`}
                                        >
                                            {config.label}
                                        </span>
                                        {event.payload && (
                                            <p className="mt-1 text-sm text-zinc-500">
                                                {Object.entries(event.payload)
                                                    .map(
                                                        ([key, value]) =>
                                                            `${key}: ${value}`
                                                    )
                                                    .join(", ")}
                                            </p>
                                        )}
                                    </div>
                                    <span className="shrink-0 text-xs text-zinc-400">
                                        {formatDistanceToNow(
                                            new Date(event.occurred_at),
                                            { addSuffix: true }
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
