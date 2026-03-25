import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAgents, useAgent, agentKeys, useCreateAgent, useUpdateAgent, useDeleteAgent, useAssignDevice, useUnassignDevice, useLinkUser } from "./use-agents";
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
    status: "active",
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

describe("agent mutation hooks", () => {
    it("useCreateAgent should call api.post and invalidate queries", async () => {
        const mockResponse = { data: mockAgent };
        vi.mocked(api.post).mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useCreateAgent(), {
            wrapper: createWrapper(),
        });

        const data = { name: "New Agent", employee_code: "EMP002" };
        result.current.mutate(data);

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(api.post).toHaveBeenCalledWith("/api/v1/admin/agents", data);
        expect(result.current.data).toEqual(mockAgent);
    });

    it("useUpdateAgent should call api.put and invalidate queries", async () => {
        const mockResponse = { data: { ...mockAgent, name: "Updated Name" } };
        vi.mocked(api.put).mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useUpdateAgent(), {
            wrapper: createWrapper(),
        });

        result.current.mutate({ id: 1, data: { name: "Updated Name" } });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(api.put).toHaveBeenCalledWith("/api/v1/admin/agents/1", { name: "Updated Name" });
        expect(result.current.data).toEqual(mockResponse.data);
    });

    it("useDeleteAgent should call api.delete", async () => {
        vi.mocked(api.delete).mockResolvedValueOnce({});

        const { result } = renderHook(() => useDeleteAgent(), {
            wrapper: createWrapper(),
        });

        result.current.mutate(1);

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(api.delete).toHaveBeenCalledWith("/api/v1/admin/agents/1");
    });

    it("useAssignDevice should call assign endpoint", async () => {
        vi.mocked(api.post).mockResolvedValueOnce({});

        const { result } = renderHook(() => useAssignDevice(), {
            wrapper: createWrapper(),
        });

        result.current.mutate({ deviceId: 10, agentId: 1 });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(api.post).toHaveBeenCalledWith("/api/v1/admin/devices/10/assign-agent", {
            agent_id: 1,
        });
    });

    it("useUnassignDevice should call unassign endpoint", async () => {
        vi.mocked(api.post).mockResolvedValueOnce({});

        const { result } = renderHook(() => useUnassignDevice(), {
            wrapper: createWrapper(),
        });

        result.current.mutate(10);

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(api.post).toHaveBeenCalledWith("/api/v1/admin/devices/10/unassign-agent");
    });

    it("useLinkUser should call link endpoint", async () => {
        vi.mocked(api.post).mockResolvedValueOnce({});

        const { result } = renderHook(() => useLinkUser(), {
            wrapper: createWrapper(),
        });

        result.current.mutate({ agentId: 1, userId: 5 });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(api.post).toHaveBeenCalledWith("/api/v1/admin/agents/1/link-user", {
            user_id: 5,
        });
    });
});
