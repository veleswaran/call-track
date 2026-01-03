import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/api/api";
import type { CallLog, PaginatedResponse } from "@shared/types";

/**
 * Query keys for call logs
 */
export const callLogKeys = {
    all: ["call-logs"] as const,
    lists: () => [...callLogKeys.all, "list"] as const,
    list: (params: Record<string, unknown>) =>
        [...callLogKeys.lists(), params] as const,
    details: () => [...callLogKeys.all, "detail"] as const,
    detail: (id: number) => [...callLogKeys.details(), id] as const,
};

export interface CallLogFilters {
    page?: number;
    per_page?: number;
    device_id?: number;
    agent_id?: number;
    classification?: "business" | "personal" | "ignored";
    call_type?: "incoming" | "outgoing" | "missed";
    date_from?: string;
    date_to?: string;
    search?: string;
}

/**
 * Fetch paginated call logs with filters
 */
export function useCallLogs(filters?: CallLogFilters) {
    const params = new URLSearchParams();

    if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                params.append(key, String(value));
            }
        });
    }

    // Default pagination
    if (!filters?.page) params.set("page", "1");
    if (!filters?.per_page) params.set("per_page", "25");

    return useQuery({
        queryKey: callLogKeys.list((filters ?? {}) as Record<string, unknown>),
        queryFn: () =>
            api.get<PaginatedResponse<CallLog>>(
                `/api/v1/admin/call-logs?${params.toString()}`
            ),
    });
}

/**
 * Fetch single call log by ID
 */
export function useCallLog(id: number) {
    return useQuery({
        queryKey: callLogKeys.detail(id),
        queryFn: () => api.get<CallLog>(`/api/v1/admin/call-logs/${id}`),
        enabled: !!id,
    });
}
