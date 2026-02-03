import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/api/api";

/**
 * Hook to update a call note via the classification endpoint.
 * Notes are stored within the classification record.
 */
export function useUpdateCallNote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            callLogId,
            note,
            classificationType = "BUSINESS"
        }: {
            callLogId: number;
            note: string;
            classificationType?: "BUSINESS" | "PERSONAL" | "IGNORED";
        }) => {
            // Notes are now stored in the classification, so we use the classify endpoint
            const response = await api.post<{ message: string }>(
                `/api/v1/admin/calls/${callLogId}/classify`,
                {
                    type: classificationType,
                    note
                }
            );
            return response;
        },
        onSuccess: () => {
            // Invalidate call logs list as it might display the note
            queryClient.invalidateQueries({ queryKey: ["call-logs"] });
        },
    });
}
