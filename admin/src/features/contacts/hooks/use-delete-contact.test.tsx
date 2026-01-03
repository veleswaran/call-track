import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useDeleteContact } from "./use-delete-contact";
import { api } from "@shared/api/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@shared/api/api", () => ({
    api: {
        delete: vi.fn(),
    },
}));

const createTestWrapper = () => {
    const queryClient = new QueryClient();
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    Wrapper.displayName = "QueryClientWrapper";
    return Wrapper;
};

describe("useDeleteContact", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should call api.delete with correct arguments", async () => {
        const { result } = renderHook(() => useDeleteContact(), {
            wrapper: createTestWrapper(),
        });

        result.current.mutate(1);

        await waitFor(() => {
            expect(api.delete).toHaveBeenCalledWith("/api/v1/admin/contacts/1");
        });
    });
});
