import { describe, it, expect, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useClassifyCall } from "./use-classify-call"
import { api } from "@shared/api/api"
import type { CallClassificationType } from "@shared/types"

// Mock api
vi.mock("@shared/api/api", () => ({
    api: {
        post: vi.fn(),
    },
}))

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            mutations: {
                retry: false,
            },
        },
    })
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    Wrapper.displayName = "QueryClientWrapper"
    return Wrapper
}

describe("useClassifyCall", () => {
    it("should classify a call successfully", async () => {
        const mockResponse = { data: { id: 1, classification: "BUSINESS" } }
        vi.mocked(api.post).mockResolvedValueOnce(mockResponse)

        const { result } = renderHook(() => useClassifyCall(), {
            wrapper: createWrapper(),
        })

        result.current.mutate({ id: 1, type: "BUSINESS" as CallClassificationType })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(api.post).toHaveBeenCalledWith("/api/v1/admin/calls/1/classify", {
            type: "BUSINESS",
        })
    })
})
