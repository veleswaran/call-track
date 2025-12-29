import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useDevices, useDevice, deviceKeys } from "./use-devices";
import { api } from "@shared/api/api";
import type { Device, PaginatedResponse } from "@shared/types";

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

const mockDevice: Device = {
    id: 1,
    device_identifier: "device-123",
    device_name: "Pixel 7",
    device_model: "Pixel 7",
    os_version: "Android 14",
    app_version: "1.0.0",
    status: "active",
    agent_id: 1,
    last_sync_at: "2024-01-01T12:00:00Z",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
};

describe("useDevices", () => {
    it("should fetch paginated devices", async () => {
        const mockResponse: PaginatedResponse<Device> = {
            data: [mockDevice],
            meta: {
                current_page: 1,
                from: 1,
                last_page: 1,
                per_page: 15,
                to: 1,
                total: 1,
            },
            links: {
                first: "/api/v1/admin/devices?page=1",
                last: "/api/v1/admin/devices?page=1",
                prev: null,
                next: null,
            },
        };

        vi.mocked(api.get).mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useDevices(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(api.get).toHaveBeenCalledWith(
            "/api/v1/admin/devices?page=1&per_page=15"
        );
        expect(result.current.data?.data).toEqual([mockDevice]);
    });
});

describe("useDevice", () => {
    it("should fetch single device by ID", async () => {
        vi.mocked(api.get).mockResolvedValueOnce(mockDevice);

        const { result } = renderHook(() => useDevice(1), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(api.get).toHaveBeenCalledWith("/api/v1/admin/devices/1");
        expect(result.current.data).toEqual(mockDevice);
    });

    it("should not fetch when ID is 0", () => {
        const { result } = renderHook(() => useDevice(0), {
            wrapper: createWrapper(),
        });

        expect(result.current.fetchStatus).toBe("idle");
    });
});

describe("deviceKeys", () => {
    it("should have correct key structure", () => {
        expect(deviceKeys.all).toEqual(["devices"]);
        expect(deviceKeys.lists()).toEqual(["devices", "list"]);
        expect(deviceKeys.detail(1)).toEqual(["devices", "detail", 1]);
    });
});
