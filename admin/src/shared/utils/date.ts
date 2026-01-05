import { formatInTimeZone } from "date-fns-tz";

export function formatDate(date: string | Date | null | undefined, formatStr = "MMM dd, yyyy HH:mm"): string {
    if (!date) return "N/A";
    return formatInTimeZone(new Date(date), "Asia/Kolkata", formatStr);
}
