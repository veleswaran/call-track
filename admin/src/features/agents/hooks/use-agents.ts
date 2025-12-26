import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/api/api";
import type { Agent, PaginatedResponse, ResourceResponse } from "@shared/types";

/**
 * Query keys for agents
 */
export const agentKeys = {
    all: ["agents"] as const,
    lists: () => [...agentKeys.all, "list"] as const,
    list: (params: Record<string, unknown>) =>
        [...agentKeys.lists(), params] as const,
    details: () => [...agentKeys.all, "detail"] as const,
    detail: (id: number) => [...agentKeys.details(), id] as const,
};

/**
 * Fetch paginated agents list
 */
export function useAgents(params?: { page?: number; per_page?: number }) {
    return useQuery({
        queryKey: agentKeys.list(params ?? {}),
        queryFn: () =>
            api.get<PaginatedResponse<Agent>>(
                `/api/v1/admin/agents?page=${params?.page ?? 1}&per_page=${params?.per_page ?? 15}`
            ),
    });
}

/**
 * Fetch single agent by ID
 */
export function useAgent(id: number) {
    return useQuery({
        queryKey: agentKeys.detail(id),
        queryFn: async () => {
            const response = await api.get<ResourceResponse<Agent>>(
                `/api/v1/admin/agents/${id}`
            );
            return response.data;
        },
        enabled: !!id,
    });
}

/**
 * Create new agent
 */
export function useCreateAgent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { name: string; email: string; phone?: string }) => {
            const response = await api.post<ResourceResponse<Agent>>(
                "/api/v1/admin/agents",
                data
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: agentKeys.lists() });
        },
    });
}

/**
 * Update existing agent
 */
export function useUpdateAgent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: number;
            data: { name?: string; email?: string; phone?: string };
        }) => {
            const response = await api.put<ResourceResponse<Agent>>(
                `/api/v1/admin/agents/${id}`,
                data
            );
            return response.data;
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: agentKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: agentKeys.lists() });
        },
    });
}

/**
 * Delete agent
 */
export function useDeleteAgent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => api.delete(`/api/v1/admin/agents/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: agentKeys.lists() });
        },
    });
}
