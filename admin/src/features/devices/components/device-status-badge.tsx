"use client";

interface DeviceStatusBadgeProps {
    status: "active" | "suspended";
}

/**
 * Badge component to display device token status (active/inactive)
 */
export function DeviceStatusBadge({ status }: DeviceStatusBadgeProps) {
    const isActive = status === "active";

    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${isActive
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}
        >
            {isActive ? "Active" : "Suspended"}
        </span>
    );
}
