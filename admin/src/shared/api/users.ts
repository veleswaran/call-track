import { api } from "./api";
import { User, PaginatedResponse, ResourceResponse } from "../types";

export interface CreateUserData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
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
};
