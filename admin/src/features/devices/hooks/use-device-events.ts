import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/api/api";
import type { DeviceEvent, PaginatedResponse } from "@shared/types";

/**
 * Query keys for device events
 */
export const deviceEventKeys = {
    all: ["deviceEvents"] as const,
    lists: () => [...deviceEventKeys.all, "list"] as const,
    list: (deviceId: number, params?: Record<string, unknown>) =>
        [...deviceEventKeys.lists(), deviceId, params] as const,
};

interface UseDeviceEventsParams {
    page?: number;
    per_page?: number;
    [key: string]: unknown;
}

/**
 * Fetch paginated device events for a specific device
 */
export function useDeviceEvents(
    deviceId: number,
    params?: UseDeviceEventsParams
) {
    return useQuery({
        queryKey: deviceEventKeys.list(deviceId, params),
        queryFn: () =>
            api.get<PaginatedResponse<DeviceEvent>>(
                `/api/v1/admin/devices/${deviceId}/events?page=${params?.page ?? 1}&per_page=${params?.per_page ?? 20}`
            ),
        enabled: !!deviceId,
    });
}
