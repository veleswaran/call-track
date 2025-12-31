"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi, CreateUserData } from "@shared/api/users";
import { toast } from "sonner";

export function useUsers(page = 1, perPage = 15) {
    return useQuery({
        queryKey: ["users", page, perPage],
        queryFn: () => usersApi.getUsers(page, perPage),
    });
}

export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateUserData) => usersApi.createUser(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success("User created successfully");
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
            // Basic error handling, can be improved with specific message extraction
            toast.error(error.response?.data?.message || "Failed to create user");
        },
    });
}

export function useDeleteUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => usersApi.deleteUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success("User deleted successfully");
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to delete user");
        },
    });
}

export function useResetTwoFactor() {
    return useMutation({
        mutationFn: (id: number) => usersApi.resetTwoFactor(id),
        onSuccess: () => {
            toast.success("Two-factor authentication reset successfully");
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to reset 2FA");
        },
    });
}
