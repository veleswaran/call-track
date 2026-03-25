import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAgents, useAgent, agentKeys } from "./use-agents";
import { api } from "@shared/api/api";
import type { Agent, PaginatedResponse } from "@shared/types";

// Mock the api module
vi.mock("@shared/api/api", () => ({
    api: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
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

const mockAgent: Agent = {
    id: 1,
    name: "John Doe",
    employee_code: "EMP001",
    status: { id: 1, name: "Active", color: "#22c55e" },
    devices_count: 2,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
};

describe("useAgents", () => {
    it("should fetch paginated agents", async () => {
        const mockResponse: PaginatedResponse<Agent> = {
            data: [mockAgent],
            meta: {
                current_page: 1,
                from: 1,
                last_page: 1,
                per_page: 15,
                to: 1,
                total: 1,
            },
            links: {
                first: "/api/v1/admin/agents?page=1",
                last: "/api/v1/admin/agents?page=1",
                prev: null,
                next: null,
            },
        };

        vi.mocked(api.get).mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useAgents(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(api.get).toHaveBeenCalledWith(
            "/api/v1/admin/agents?page=1&per_page=15"
        );
        expect(result.current.data?.data).toEqual([mockAgent]);
    });

    it("should fetch with custom pagination", async () => {
        vi.mocked(api.get).mockResolvedValueOnce({ data: [], meta: {} });

        const { result } = renderHook(() => useAgents({ page: 2, per_page: 10 }), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(api.get).toHaveBeenCalledWith(
            "/api/v1/admin/agents?page=2&per_page=10"
        );
    });
});

describe("useAgent", () => {
    it("should fetch single agent by ID", async () => {
        vi.mocked(api.get).mockResolvedValueOnce({ data: mockAgent });

        const { result } = renderHook(() => useAgent(1), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(api.get).toHaveBeenCalledWith("/api/v1/admin/agents/1");
        expect(result.current.data).toEqual(mockAgent);
    });

    it("should not fetch when ID is 0", () => {
        const { result } = renderHook(() => useAgent(0), {
            wrapper: createWrapper(),
        });

        expect(result.current.fetchStatus).toBe("idle");
    });
});

describe("agentKeys", () => {
    it("should have correct key structure", () => {
        expect(agentKeys.all).toEqual(["agents"]);
        expect(agentKeys.lists()).toEqual(["agents", "list"]);
        expect(agentKeys.list({ page: 1 })).toEqual(["agents", "list", { page: 1 }]);
        expect(agentKeys.detail(1)).toEqual(["agents", "detail", 1]);
    });
});
