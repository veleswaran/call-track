import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createWrapper } from "@shared/utils/test-utils"; // You might need to check if this exists or create a wrapper
import { useUpdateCallNote } from "./use-update-call-note";
import { api } from "@shared/api/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock API
vi.mock("@shared/api/api", () => ({
    api: {
        put: vi.fn(),
    },
}));

const createTestWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe("useUpdateCallNote", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should call api.put with correct arguments", async () => {
        const { result } = renderHook(() => useUpdateCallNote(), {
            wrapper: createTestWrapper(),
        });

        const payload = { callLogId: 1, note: "Test Note" };

        result.current.mutate(payload);

        await waitFor(() => {
            expect(api.put).toHaveBeenCalledWith("/api/v1/admin/calls/1/note", {
                note: "Test Note",
            });
        });
    });
});
