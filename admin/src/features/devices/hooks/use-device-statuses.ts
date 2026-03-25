import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/api/api";

export interface DeviceStatus {
    id: number;
    name: string;
    color: string;
    is_default: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface DeviceStatusPayload {
    name: string;
    color: string;
    is_default: boolean;
    is_active: boolean;
}

export const deviceStatusKeys = {
    all: ["device-statuses"] as const,
    lists: () => [...deviceStatusKeys.all, "list"] as const,
    details: () => [...deviceStatusKeys.all, "detail"] as const,
    detail: (id: number) => [...deviceStatusKeys.details(), id] as const,
};

export function useDeviceStatuses() {
    return useQuery({
        queryKey: deviceStatusKeys.lists(),
        queryFn: () => api.get<{ data: DeviceStatus[] }>("/api/v1/admin/device-statuses"),
    });
}

export function useCreateDeviceStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: DeviceStatusPayload) =>
            api.post<{ data: DeviceStatus }>("/api/v1/admin/device-statuses", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: deviceStatusKeys.all });
        },
    });
}

export function useUpdateDeviceStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: DeviceStatusPayload }) =>
            api.put<{ data: DeviceStatus }>(`/api/v1/admin/device-statuses/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: deviceStatusKeys.all });
        },
    });
}

export function useDeleteDeviceStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) =>
            api.delete(`/api/v1/admin/device-statuses/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: deviceStatusKeys.all });
        },
    });
}
