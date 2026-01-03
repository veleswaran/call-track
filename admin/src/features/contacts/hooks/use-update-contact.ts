import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/api/api";
import type { Contact } from "@shared/types";
import { contactKeys } from "@features/contacts/hooks/use-contacts";

export function useUpdateContact() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: { name: string; phone_number: string } }) => {
            const response = await api.put<{ data: Contact }>(`/api/v1/admin/contacts/${id}`, data);
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["call-logs"] });
            queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
        },
    });
}
