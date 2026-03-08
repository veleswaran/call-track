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
export function useDevices(params?: { page?: number; per_page?: number }) {
    return useQuery({
        queryKey: deviceKeys.list(params ?? {}),
        queryFn: () =>
            api.get<PaginatedResponse<Device>>(
                `/api/v1/admin/devices?page=${params?.page ?? 1}&per_page=${params?.per_page ?? 15}`
            ),
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
