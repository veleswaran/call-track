/**
 * Format duration in seconds to a human-readable string, e.g.:
 * 0 -> "-"
 * 59 -> "59s"
 * 60 -> "1m"
 * 61 -> "1m 1s"
 * 3600 -> "1h"
 * 3661 -> "1h 1m 1s"
 */
export function formatDuration(seconds: number): string {
    if (!seconds || seconds <= 0) return "-";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const parts: string[] = [];
    if (h) parts.push(`${h}h`);
    if (m) parts.push(`${m}m`);
    if (s || parts.length === 0) parts.push(`${s}s`);
    return parts.join(" ");
}

export default formatDuration;
