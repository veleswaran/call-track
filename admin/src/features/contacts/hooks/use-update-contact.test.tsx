import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useUpdateContact } from "./use-update-contact";
import { api } from "@shared/api/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@shared/api/api", () => ({
    api: {
        put: vi.fn(),
    },
}));

const createTestWrapper = () => {
    const queryClient = new QueryClient();
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe("useUpdateContact", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should call api.put with correct arguments", async () => {
        const { result } = renderHook(() => useUpdateContact(), {
            wrapper: createTestWrapper(),
        });

        const variables = { id: 1, data: { name: "Updated Name", phone_number: "1234567890" } };

        result.current.mutate(variables);

        await waitFor(() => {
            expect(api.put).toHaveBeenCalledWith("/api/v1/admin/contacts/1", {
                name: "Updated Name",
                phone_number: "1234567890",
            });
        });
    });
});
