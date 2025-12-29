import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/api/api";
import { callLogKeys } from "./use-call-logs";
import type { CallClassificationType, CallLog } from "@shared/types";

export function useClassifyCall() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, type }: { id: number; type: CallClassificationType }) => {
            const response = await api.post<{ data: CallLog }>(`/api/v1/admin/calls/${id}/classify`, {
                type: type.toUpperCase(),
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: callLogKeys.lists() });
        },
    });
}
