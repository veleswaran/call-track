import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useDeviceEvents, deviceEventKeys } from "./use-device-events";
import { api } from "@shared/api/api";
import type { DeviceEvent, PaginatedResponse } from "@shared/types";

// Mock the api module
vi.mock("@shared/api/api", () => ({
    api: {
        get: vi.fn(),
    },
}));

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    wrapper.displayName = "QueryClientWrapper";
    return wrapper;
}

const mockDeviceEvent: DeviceEvent = {
    id: 1,
    device_id: 1,
    event_type: "APP_STOPPED",
    payload: { reason: "user_action" },
    occurred_at: "2026-01-21T10:30:00Z",
    created_at: "2026-01-21T10:30:00Z",
};

describe("useDeviceEvents", () => {
    it("should fetch paginated device events", async () => {
        const mockResponse: PaginatedResponse<DeviceEvent> = {
            data: [mockDeviceEvent],
            meta: {
                current_page: 1,
                from: 1,
                last_page: 1,
                per_page: 20,
                to: 1,
                total: 1,
            },
            links: {
                first: "/api/v1/admin/devices/1/events?page=1",
                last: "/api/v1/admin/devices/1/events?page=1",
                prev: null,
                next: null,
            },
        };

        vi.mocked(api.get).mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useDeviceEvents(1), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(api.get).toHaveBeenCalledWith(
            "/api/v1/admin/devices/1/events?page=1&per_page=20"
        );
        expect(result.current.data?.data).toEqual([mockDeviceEvent]);
    });

    it("should not fetch when deviceId is 0", () => {
        const { result } = renderHook(() => useDeviceEvents(0), {
            wrapper: createWrapper(),
        });

        expect(result.current.fetchStatus).toBe("idle");
    });

    it("should use custom pagination params", async () => {
        const mockResponse: PaginatedResponse<DeviceEvent> = {
            data: [mockDeviceEvent],
            meta: {
                current_page: 2,
                from: 11,
                last_page: 3,
                per_page: 10,
                to: 20,
                total: 25,
            },
            links: {
                first: "/api/v1/admin/devices/1/events?page=1",
                last: "/api/v1/admin/devices/1/events?page=3",
                prev: "/api/v1/admin/devices/1/events?page=1",
                next: "/api/v1/admin/devices/1/events?page=3",
            },
        };

        vi.mocked(api.get).mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(
            () => useDeviceEvents(1, { page: 2, per_page: 10 }),
            { wrapper: createWrapper() }
        );

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(api.get).toHaveBeenCalledWith(
            "/api/v1/admin/devices/1/events?page=2&per_page=10"
        );
    });
});

describe("deviceEventKeys", () => {
    it("should have correct key structure", () => {
        expect(deviceEventKeys.all).toEqual(["deviceEvents"]);
        expect(deviceEventKeys.lists()).toEqual(["deviceEvents", "list"]);
        expect(deviceEventKeys.list(1, {})).toEqual([
            "deviceEvents",
            "list",
            1,
            {},
        ]);
    });
});
