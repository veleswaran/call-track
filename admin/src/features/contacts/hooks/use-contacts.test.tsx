import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useContacts, contactKeys } from "./use-contacts";
import { api } from "@shared/api/api";
import type { Contact, PaginatedResponse } from "@shared/types";

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
    const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    wrapper.displayName = "QueryClientWrapper";
    return wrapper;
}

const mockContact: Contact = {
    id: 1,
    phone_number: "+1234567890",
    name: "John Doe",
    company: null,
    notes: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
};

describe("useContacts", () => {
    it("should fetch paginated contacts", async () => {
        const mockResponse: PaginatedResponse<Contact> = {
            data: [mockContact],
            meta: {
                current_page: 1,
                from: 1,
                last_page: 1,
                per_page: 15,
                to: 1,
                total: 1,
            },
            links: {
                first: "/api/v1/admin/contacts?page=1",
                last: "/api/v1/admin/contacts?page=1",
                prev: null,
                next: null,
            },
        };

        vi.mocked(api.get).mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useContacts({ page: 1, per_page: 15 }), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(api.get).toHaveBeenCalledWith(
            expect.stringContaining("/api/v1/admin/contacts")
        );
        expect(result.current.data?.data).toEqual([mockContact]);
    });

    it("should include device_id filter when provided", async () => {
        const mockResponse: PaginatedResponse<Contact> = {
            data: [],
            meta: {
                current_page: 1,
                from: null,
                last_page: 1,
                per_page: 15,
                to: null,
                total: 0,
            },
            links: {
                first: "/api/v1/admin/contacts?page=1",
                last: "/api/v1/admin/contacts?page=1",
                prev: null,
                next: null,
            },
        };

        vi.mocked(api.get).mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(
            () => useContacts({ page: 1, per_page: 15, device_id: 5 }),
            {
                wrapper: createWrapper(),
            }
        );

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(api.get).toHaveBeenCalledWith(
            expect.stringContaining("device_id=5")
        );
    });

    it("should include search filter when provided", async () => {
        const mockResponse: PaginatedResponse<Contact> = {
            data: [],
            meta: {
                current_page: 1,
                from: null,
                last_page: 1,
                per_page: 15,
                to: null,
                total: 0,
            },
            links: {
                first: "/api/v1/admin/contacts?page=1",
                last: "/api/v1/admin/contacts?page=1",
                prev: null,
                next: null,
            },
        };

        vi.mocked(api.get).mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(
            () => useContacts({ page: 1, per_page: 15, search: "John" }),
            {
                wrapper: createWrapper(),
            }
        );

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(api.get).toHaveBeenCalledWith(
            expect.stringContaining("search=John")
        );
    });
});

describe("contactKeys", () => {
    it("should have correct key structure", () => {
        expect(contactKeys.all).toEqual(["contacts"]);
        expect(contactKeys.lists()).toEqual(["contacts", "list"]);
        expect(contactKeys.list({ page: 1, per_page: 15 })).toEqual([
            "contacts",
            "list",
            { page: 1, per_page: 15 },
        ]);
    });
});
