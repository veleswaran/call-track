import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCreateContact } from "./use-create-contact";
import { api } from "@shared/api/api";
import type { Contact } from "@shared/types";

vi.mock("@shared/api/api", () => ({
    api: {
        post: vi.fn(),
    },
}));

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
            mutations: {
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
    is_internal: false,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
};

describe("useCreateContact", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should create a contact successfully", async () => {
        const mockResponse = { data: mockContact };
        vi.mocked(api.post).mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useCreateContact(), {
            wrapper: createWrapper(),
        });

        const contactData = {
            name: "John Doe",
            phone_number: "+1234567890",
            is_internal: false,
        };

        result.current.mutate(contactData);

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(api.post).toHaveBeenCalledWith("/api/v1/admin/contacts", contactData);
        expect(result.current.data).toEqual(mockContact);
    });

    it("should handle errors when creating contact", async () => {
        const mockError = new Error("Failed to create contact");
        vi.mocked(api.post).mockRejectedValueOnce(mockError);

        const { result } = renderHook(() => useCreateContact(), {
            wrapper: createWrapper(),
        });

        const contactData = {
            name: "John Doe",
            phone_number: "+1234567890",
            is_internal: false,
        };

        result.current.mutate(contactData);

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error).toEqual(mockError);
    });

    it("should set isPending state during mutation", async () => {
        const mockResponse = { data: mockContact };
        vi.mocked(api.post).mockImplementation(
            () =>
                new Promise((resolve) => {
                    setTimeout(() => resolve(mockResponse), 100);
                })
        );

        const { result } = renderHook(() => useCreateContact(), {
            wrapper: createWrapper(),
        });

        const contactData = {
            name: "John Doe",
            phone_number: "+1234567890",
            is_internal: false,
        };

        result.current.mutate(contactData);

        // Wait for isPending to become true (state updates are async)
        await waitFor(() => expect(result.current.isPending).toBe(true));

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.isPending).toBe(false);
    });
});
