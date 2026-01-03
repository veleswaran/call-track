import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/api/api";
import type { CallNote } from "@shared/types";

export function useUpdateCallNote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ callLogId, note }: { callLogId: number; note: string }) => {
            const response = await api.put<{ data: CallNote }>(`/api/v1/admin/calls/${callLogId}/note`, { note });
            return response.data;
        },
        onSuccess: () => {
            // Invalidate call logs list as it might display the note
            queryClient.invalidateQueries({ queryKey: ["call-logs"] });
        },
    });
}
