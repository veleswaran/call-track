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
export function useAgents(params?: { page?: number; per_page?: number; search?: string; status?: string }) {
    return useQuery({
        queryKey: agentKeys.list(params ?? {}),
        queryFn: () => {
            const queryParams = new URLSearchParams();
            queryParams.append("page", (params?.page ?? 1).toString());
            queryParams.append("per_page", (params?.per_page ?? 15).toString());
            if (params?.search) queryParams.append("search", params.search);
            if (params?.status) queryParams.append("status", params.status);
            
            return api.get<PaginatedResponse<Agent>>(`/api/v1/admin/agents?${queryParams.toString()}`);
        },
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
        mutationFn: async (data: { name: string; employee_code?: string; agent_status_id?: number }) => {
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
            data: { name?: string; employee_code?: string; agent_status_id?: number };
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

/**
 * Query keys for devices
 */
export const deviceKeys = {
    all: ["devices"] as const,
    lists: () => [...deviceKeys.all, "list"] as const,
};

/**
 * Fetch devices list
 */
export function useDevices() {
    return useQuery({
        queryKey: deviceKeys.lists(),
        queryFn: () =>
            api.get<{ data: Array<{ id: number; device_identifier: string; device_name: string | null; agent_id: number | null }> }>(
                "/api/v1/admin/devices"
            ),
    });
}

/**
 * Assign agent to a device
 */
export function useAssignDevice() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ deviceId, agentId }: { deviceId: number; agentId: number }) => {
            return api.post(`/api/v1/admin/devices/${deviceId}/assign-agent`, {
                agent_id: agentId,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: deviceKeys.lists() });
            queryClient.invalidateQueries({ queryKey: agentKeys.lists() });
        },
    });
}

/**
 * Unassign agent from a device
 */
export function useUnassignDevice() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (deviceId: number) => {
            return api.post(`/api/v1/admin/devices/${deviceId}/unassign-agent`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: deviceKeys.lists() });
            queryClient.invalidateQueries({ queryKey: agentKeys.lists() });
        },
    });
}
/**
 * Link a system user to an agent profile
 */
export function useLinkUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ agentId, userId }: { agentId: number; userId: number }) => {
            return api.post(`/api/v1/admin/agents/${agentId}/link-user`, {
                user_id: userId,
            });
        },
        onSuccess: (_, { agentId }) => {
            queryClient.invalidateQueries({ queryKey: agentKeys.detail(agentId) });
            queryClient.invalidateQueries({ queryKey: agentKeys.lists() });
        },
    });
}
