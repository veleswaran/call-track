import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useImportContacts } from "./use-import-contacts";
import { api } from "@shared/api/api";
import { toast } from "sonner";

vi.mock("@shared/api/api", () => ({
    api: {
        postForm: vi.fn(),
    },
}));

vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn(),
    },
}));

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    wrapper.displayName = "QueryClientWrapper";
    return wrapper;
}

describe("useImportContacts", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("uploads a CSV file and shows a success toast", async () => {
        vi.mocked(api.postForm).mockResolvedValueOnce({
            total_rows: 2,
            created: 2,
            updated: 0,
            failed: 0,
            errors: [],
        });

        const file = new File(["name,phone_number\nJohn,9876543210"], "contacts.csv", {
            type: "text/csv",
        });

        const { result } = renderHook(() => useImportContacts(), {
            wrapper: createWrapper(),
        });

        result.current.mutate(file);

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(api.postForm).toHaveBeenCalledWith(
            "/api/v1/admin/contacts/import",
            expect.any(FormData),
        );
        expect(toast.success).toHaveBeenCalled();
    });

    it("shows a warning toast when some rows fail", async () => {
        vi.mocked(api.postForm).mockResolvedValueOnce({
            total_rows: 2,
            created: 1,
            updated: 0,
            failed: 1,
            errors: [{ row: 3, message: "Name is required." }],
        });

        const file = new File(["name,phone_number\nJohn,9876543210"], "contacts.csv", {
            type: "text/csv",
        });

        const { result } = renderHook(() => useImportContacts(), {
            wrapper: createWrapper(),
        });

        result.current.mutate(file);

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(toast.warning).toHaveBeenCalled();
    });
});
