import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/api/api";
import { contactKeys } from "@features/contacts/hooks/use-contacts";

export function useDeleteContact() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/api/v1/admin/contacts/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["call-logs"] });
            queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
        },
    });
}
