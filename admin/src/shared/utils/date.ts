import { format } from "date-fns";

export function formatDate(date: string | Date | null | undefined, formatStr = "MMM dd, yyyy HH:mm"): string {
    if (!date) return "N/A";
    return format(new Date(date), formatStr);
}
