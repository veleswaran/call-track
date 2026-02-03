import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useUpdateCallNote } from "./use-update-call-note";
import { api } from "@shared/api/api";
import type { PropsWithChildren } from "react";

vi.mock("@shared/api/api", () => ({
    api: {
        post: vi.fn(),
    },
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });
    return function Wrapper({ children }: PropsWithChildren) {
        return (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );
    };
};

describe("useUpdateCallNote", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should call the classify endpoint with note and type", async () => {
        const mockResponse = { message: "Call classified successfully" };
        (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useUpdateCallNote(), {
            wrapper: createWrapper(),
        });

        result.current.mutate({
            callLogId: 1,
            note: "Test note content",
            classificationType: "BUSINESS",
        });

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith("/api/v1/admin/calls/1/classify", {
                type: "BUSINESS",
                note: "Test note content",
            });
        });
    });

    it("should default to BUSINESS classification when not specified", async () => {
        const mockResponse = { message: "Call classified successfully" };
        (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useUpdateCallNote(), {
            wrapper: createWrapper(),
        });

        result.current.mutate({
            callLogId: 2,
            note: "Another note",
        });

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith("/api/v1/admin/calls/2/classify", {
                type: "BUSINESS",
                note: "Another note",
            });
        });
    });
});
