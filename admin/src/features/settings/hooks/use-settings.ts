import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "../api/settings-api";
import { SettingsUpdatePayload } from "../types";
import { toast } from "sonner";
import { getApiErrorMessage } from "@shared/utils/error";

export const useSettingsQuery = () => {
    return useQuery({
        queryKey: ['settings'],
        queryFn: settingsApi.getSettings,
        select: (response) => response.data,
    });
};

export const useUpdateSettingsMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: SettingsUpdatePayload) => settingsApi.updateSettings(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings'] });
            toast.success("Success", {
                description: "Settings updated successfully",
            });
        },
        onError: (error: unknown) => {
            toast.error("Error", {
                description: getApiErrorMessage(error, "Failed to update settings"),
            });
        }
    });
};
