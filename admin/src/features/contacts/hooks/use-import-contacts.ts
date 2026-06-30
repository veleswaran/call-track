import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/api/api";
import type { ContactImportResult } from "@shared/types";
import { contactKeys } from "@features/contacts/hooks/use-contacts";
import { toast } from "sonner";

export function useImportContacts() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append("file", file);

            return api.postForm<ContactImportResult>("/api/v1/admin/contacts/import", formData);
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ["call-logs"] });

            const successful = result.created + result.updated;

            if (result.failed === 0) {
                toast.success(
                    `Imported ${successful} contact${successful === 1 ? "" : "s"} (${result.created} new, ${result.updated} updated).`
                );
                return;
            }

            toast.warning(
                `Imported ${successful} contact${successful === 1 ? "" : "s"} with ${result.failed} failed row${result.failed === 1 ? "" : "s"}.`
            );
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to import contacts");
        },
    });
}
