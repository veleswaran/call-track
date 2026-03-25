import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/api/api";

export interface AgentStatus {
    id: number;
    name: string;
    color: string;
    is_default: boolean;
    is_active: boolean;
}

export function useAgentStatuses() {
    return useQuery({
        queryKey: ["agent-statuses"],
        queryFn: () => api.get<{ data: AgentStatus[] }>("/api/v1/admin/agent-statuses"),
        staleTime: 5 * 60 * 1000,
    });
}

export function useCreateAgentStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Omit<AgentStatus, "id" | "is_default"> & { is_default?: boolean }) =>
            api.post<{ data: AgentStatus }>("/api/v1/admin/agent-statuses", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["agent-statuses"] });
        },
    });
}

export function useUpdateAgentStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<AgentStatus> }) =>
            api.put<{ data: AgentStatus }>(`/api/v1/admin/agent-statuses/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["agent-statuses"] });
            queryClient.invalidateQueries({ queryKey: ["agents"] }); // Invalidate agents since their assigned statuses might have visually changed
        },
    });
}

export function useDeleteAgentStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) =>
            api.delete(`/api/v1/admin/agent-statuses/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["agent-statuses"] });
        },
    });
}
