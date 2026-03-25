import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/api/api";
import type { Device, PaginatedResponse } from "@shared/types";

/**
 * Query keys for devices
 */
export const deviceKeys = {
    all: ["devices"] as const,
    lists: () => [...deviceKeys.all, "list"] as const,
    list: (params: Record<string, unknown>) =>
        [...deviceKeys.lists(), params] as const,
    details: () => [...deviceKeys.all, "detail"] as const,
    detail: (id: number) => [...deviceKeys.details(), id] as const,
};

/**
 * Fetch paginated devices list
 */
export function useDevices(params?: { page?: number; per_page?: number; search?: string; status?: string }) {
    return useQuery({
        queryKey: deviceKeys.list(params ?? {}),
        queryFn: () => {
            const queryParams = new URLSearchParams();
            if (params?.page) queryParams.append("page", params.page.toString());
            if (params?.per_page) queryParams.append("per_page", params.per_page.toString());
            if (params?.search) queryParams.append("search", params.search);
            if (params?.status) queryParams.append("status", params.status);
            
            return api.get<PaginatedResponse<Device>>(`/api/v1/admin/devices?${queryParams.toString()}`);
        },
    });
}

/**
 * Fetch single device by ID
 */
export function useDevice(id: number) {
    return useQuery({
        queryKey: deviceKeys.detail(id),
        queryFn: () => api.get<Device>(`/api/v1/admin/devices/${id}`),
        enabled: !!id,
    });
}

/**
 * Revoke all active tokens for a device
 */
export function useRevokeDeviceTokens() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (deviceId: number) =>
            api.post<{ message: string; revoked_count: number }>(
                `/api/v1/admin/devices/${deviceId}/revoke-tokens`
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: deviceKeys.all });
        },
    });
}

export interface GenerateDeviceCodeParams {
    agent_id: number;
    expires_in_hours: number | null;
}

export interface GeneratedCode {
    code: string;
    expires_at: string | null;
    agent_id: number;
}

export function useGenerateDeviceCode() {
    return useMutation({
        mutationFn: (data: GenerateDeviceCodeParams) =>
            api.post<{ data: GeneratedCode }>("/api/v1/admin/devices/codes", data),
    });
}

export interface SendPushNotificationParams {
    title?: string;
    body?: string;
}

export function useSendPushNotification(deviceId: number) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: SendPushNotificationParams) =>
            api.post<{ message: string }>(`/api/v1/admin/devices/${deviceId}/push`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: deviceKeys.detail(deviceId) });
        },
    });
}
