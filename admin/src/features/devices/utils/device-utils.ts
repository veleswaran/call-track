/**
 * Device utility functions for heartbeat status checking
 */

const STALE_THRESHOLD_HOURS = 1;
const HEARTBEAT_ACTIVE_MINUTES = 30;
const HEARTBEAT_WARNING_MINUTES = 60;

/**
 * Check if a device's heartbeat is stale (>1 hour old or never synced)
 */
export function isDeviceStale(lastSyncAt: string | null): boolean {
    if (!lastSyncAt) {
        return true; // Never synced = stale
    }

    const lastSync = new Date(lastSyncAt);
    const now = new Date();
    const diffHours = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);

    return diffHours > STALE_THRESHOLD_HOURS;
}

/**
 * Get the heartbeat status category for UI display
 */
export type HeartbeatStatus = "active" | "warning" | "stale";

export function getHeartbeatStatus(lastSyncAt: string | null): HeartbeatStatus {
    if (!lastSyncAt) {
        return "stale";
    }

    const lastSync = new Date(lastSyncAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSync.getTime()) / (1000 * 60);

    if (diffMinutes <= HEARTBEAT_ACTIVE_MINUTES) {
        return "active"; // Within last 30 minutes
    } else if (diffMinutes <= HEARTBEAT_WARNING_MINUTES) {
        return "warning"; // 30-60 minutes
    } else {
        return "stale"; // Over 1 hour
    }
}

/**
 * Format the last sync time in a human-readable format
 */
export function formatLastSync(lastSyncAt: string | null): string {
    if (!lastSyncAt) {
        return "Never";
    }

    const lastSync = new Date(lastSyncAt);
    const now = new Date();
    const diffMinutes = Math.floor(
        (now.getTime() - lastSync.getTime()) / (1000 * 60)
    );

    if (diffMinutes < 1) {
        return "Just now";
    } else if (diffMinutes < 60) {
        return `${diffMinutes}m ago`;
    } else if (diffMinutes < 1440) {
        const hours = Math.floor(diffMinutes / 60);
        return `${hours}h ago`;
    } else {
        const days = Math.floor(diffMinutes / 1440);
        return `${days}d ago`;
    }
}
