import { api } from "@shared/api/api";
import { SettingsData, SettingsUpdatePayload } from "../types";

export const settingsApi = {
    getSettings: async (): Promise<{ data: SettingsData }> => {
        return api.get<{ data: SettingsData }>('/api/v1/admin/settings');
    },

    updateSettings: async (payload: SettingsUpdatePayload): Promise<{ message: string }> => {
        return api.post<{ message: string }>('/api/v1/admin/settings', payload);
    }
};
