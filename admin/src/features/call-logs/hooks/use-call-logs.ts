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
    search?: string;

    // Filters
    device_id?: number;

    // Array filters support
    agents?: number[];    // Replaces single agent_id
    types?: ("incoming" | "outgoing" | "missed" | "unknown")[]; // Replaces single call_type
    statuses?: ("Connected" | "Missed" | "No Answer")[];
    classifications?: ("business" | "personal" | "ignored")[];

    // Date range
    start_date?: string;  // backend parameter names
    end_date?: string;

    // Legacy single value support (optional, keep if needed)
    agent_id?: number;
    call_type?: "incoming" | "outgoing" | "missed" | "unknown";
    classification?: "business" | "personal" | "ignored";

    // Team Filter
    team_id?: number;
}

/**
 * Fetch paginated call logs with filters
 */
export function useCallLogs(filters?: CallLogFilters) {
    const params = new URLSearchParams();

    if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                    value.forEach(v => params.append(`${key}[]`, String(v)));
                } else {
                    params.append(key, String(value));
                }
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
