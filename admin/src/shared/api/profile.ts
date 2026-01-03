import { api } from "./api";

export interface UpdatePasswordData {
    current_password: string;
    password: string;
    password_confirmation: string;
}

export const profileApi = {
    updatePassword: async (data: UpdatePasswordData) => {
        await api.post("/api/v1/profile/password", data);
    },
};
