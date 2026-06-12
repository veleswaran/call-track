import { api } from "@shared/api/api";
import type { GetEscalationsParams } from "../types/escalation";

const buildExportQueryString = (filters: GetEscalationsParams): string => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
        if (key === "page" || key === "per_page") {
            return;
        }

        if (value !== undefined && value !== null && value !== "all") {
            if (Array.isArray(value)) {
                value.forEach((v) => params.append(`${key}[]`, String(v)));
            } else {
                params.append(key, String(value));
            }
        }
    });

    return params.toString();
};

export async function exportMissedCallsCsv(filters: GetEscalationsParams): Promise<void> {
    const queryString = buildExportQueryString(filters);
    const { blob, filename } = await api.download(
        `/api/v1/admin/call-logs/escalations/export?${queryString}`
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
}
