"use client";

import type { Device } from "@shared/types";

interface DeviceStatusBadgeProps {
    status: Device["status"];
}

/**
 * Badge component to display dynamic device status
 */
export function DeviceStatusBadge({ status }: DeviceStatusBadgeProps) {
    if (!status) {
        return <span className="text-zinc-400">—</span>;
    }

    return (
        <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ color: status.color, backgroundColor: `${status.color}20` }}
        >
            {status.name}
        </span>
    );
}
