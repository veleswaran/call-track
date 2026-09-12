import { api } from "./api";
import { User, PaginatedResponse, ResourceResponse } from "../types";

export interface CreateUserData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    is_agent?: boolean;
    is_team?: boolean;
    status?: string;
    employee_code?: string;
    team_id?: number;
    role?: string;
}

export const usersApi = {
    getUsers: async (page = 1, perPage = 15, search?: string) => {
        const params = new URLSearchParams({
            page: page.toString(),
            per_page: perPage.toString(),
        });
        if (search) {
            params.append('search', search);
        }
        return api.get<PaginatedResponse<User>>(`/api/v1/admin/users?${params.toString()}`);
    },

    createUser: async (data: CreateUserData) => {
        const response = await api.post<ResourceResponse<User>>("/api/v1/admin/users", data);
        return response.data;
    },

    deleteUser: async (id: number) => {
        await api.delete(`/api/v1/admin/users/${id}`);
    },

    resetTwoFactor: async (id: number) => {
        await api.post(`/api/v1/admin/users/${id}/reset-2fa`);
    },

    updateRole: async (id: number, role: string) => {
        await api.put(`/api/v1/admin/users/${id}/role`, { role });
    },

    resetPassword: async (id: number, password: string, password_confirmation: string) => {
        await api.put(`/api/v1/admin/users/${id}/reset-password`, { password, password_confirmation });
    },

    unlinkUserFromAgent: async (agentId: number, userId: number) => {
        await api.post(`/api/v1/admin/agents/${agentId}/unlink-user`, { user_id: userId });
    },
};
