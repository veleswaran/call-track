import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/api/api";
import type { Contact } from "@shared/types";

export function useCreateContact() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { device_id: string; name: string; phone_number: string }) => {
            const response = await api.post<{ data: Contact }>("/api/v1/admin/contacts", data);
            return response.data;
        },
        onSuccess: () => {
            // Invalidate call logs to update "contact_name" if backend returns it (it should if relation exists)
            // Invalidating "contacts" key as well if we had one.
            queryClient.invalidateQueries({ queryKey: ["call-logs"] });
        },
    });
}
