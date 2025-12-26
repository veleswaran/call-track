import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCallLogs, useCallLog, callLogKeys } from "./use-call-logs";
import { api } from "@shared/api/api";
import type { CallLog, PaginatedResponse } from "@shared/types";

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

const mockCallLog: CallLog = {
    id: 1,
    device_id: 1,
    phone_number: "+1234567890",
    contact_name: "John Doe",
    call_type: "incoming",
    duration_seconds: 120,
    call_timestamp: "2024-01-01T10:00:00Z",
    classification: "business",
    created_at: "2024-01-01T10:05:00Z",
    updated_at: "2024-01-01T10:05:00Z",
};

describe("useCallLogs", () => {
    it("should fetch paginated call logs", async () => {
        const mockResponse: PaginatedResponse<CallLog> = {
            data: [mockCallLog],
            meta: {
                current_page: 1,
                from: 1,
                last_page: 1,
                per_page: 25,
                to: 1,
                total: 1,
            },
            links: {
                first: "/api/v1/admin/call-logs?page=1",
                last: "/api/v1/admin/call-logs?page=1",
                prev: null,
                next: null,
            },
        };

        vi.mocked(api.get).mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useCallLogs(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(api.get).toHaveBeenCalledWith(
            "/api/v1/admin/call-logs?page=1&per_page=25"
        );
        expect(result.current.data?.data).toEqual([mockCallLog]);
    });

    it("should fetch with filters", async () => {
        vi.mocked(api.get).mockResolvedValueOnce({ data: [], meta: {} });

        const { result } = renderHook(
            () =>
                useCallLogs({
                    device_id: 1,
                    classification: "business",
                    page: 2,
                }),
            {
                wrapper: createWrapper(),
            }
        );

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(api.get).toHaveBeenCalledWith(
            expect.stringContaining("device_id=1")
        );
        expect(api.get).toHaveBeenCalledWith(
            expect.stringContaining("classification=business")
        );
        expect(api.get).toHaveBeenCalledWith(expect.stringContaining("page=2"));
    });
});

describe("useCallLog", () => {
    it("should fetch single call log by ID", async () => {
        vi.mocked(api.get).mockResolvedValueOnce(mockCallLog);

        const { result } = renderHook(() => useCallLog(1), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(api.get).toHaveBeenCalledWith("/api/v1/admin/call-logs/1");
        expect(result.current.data).toEqual(mockCallLog);
    });
});

describe("callLogKeys", () => {
    it("should have correct key structure", () => {
        expect(callLogKeys.all).toEqual(["call-logs"]);
        expect(callLogKeys.lists()).toEqual(["call-logs", "list"]);
        expect(callLogKeys.detail(1)).toEqual(["call-logs", "detail", 1]);
    });
});
