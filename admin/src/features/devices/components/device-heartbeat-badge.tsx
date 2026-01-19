"use client";

import { Badge } from "@shared/components/ui/badge";
import {
    HeartbeatStatus,
    getHeartbeatStatus,
    formatLastSync,
} from "../utils/device-utils";

interface DeviceHeartbeatBadgeProps {
    lastSyncAt: string | null;
    showTime?: boolean;
}

const statusConfig: Record<
    HeartbeatStatus,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
    active: { label: "Active", variant: "default" },
    warning: { label: "Warning", variant: "secondary" },
    stale: { label: "Stale", variant: "destructive" },
};

/**
 * Badge component showing the device's heartbeat status.
 * - Active (green): Last sync within 30 minutes
 * - Warning (amber): Last sync 30-60 minutes ago
 * - Stale (red): Last sync over 1 hour ago or never
 */
export function DeviceHeartbeatBadge({
    lastSyncAt,
    showTime = true,
}: DeviceHeartbeatBadgeProps) {
    const status = getHeartbeatStatus(lastSyncAt);
    const config = statusConfig[status];
    const timeDisplay = formatLastSync(lastSyncAt);

    return (
        <div className="flex items-center gap-2">
            <Badge variant={config.variant}>{config.label}</Badge>
            {showTime && (
                <span className="text-sm text-muted-foreground">{timeDisplay}</span>
            )}
        </div>
    );
}
