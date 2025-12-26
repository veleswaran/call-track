import { useQuery } from "@tanstack/react-query";
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
