"use client";

import type { Device } from "@shared/types";

interface DeviceStatusBadgeProps {
    status: Device["status"];
}

/**
 * Badge component to display dynamic device status
 */
export function DeviceStatusBadge({ status }: DeviceStatusBadgeProps) {
    if (typeof status !== 'string') {
        return <span className="text-zinc-400">—</span>;
    }

    const getStatusStyles = (s: string) => {
        const lowerStatus = s.toLowerCase();
        switch (lowerStatus) {
            case 'active': return 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-400';
            case 'maintenance': return 'bg-amber-500/20 text-amber-500 border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-400';
            case 'inactive':
            default: return 'bg-zinc-500/20 text-zinc-500 border-zinc-500/40 dark:bg-zinc-500/10 dark:text-zinc-400';
        }
    };

    const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${getStatusStyles(status)}`}
        >
            {formattedStatus}
        </span>
    );
}
