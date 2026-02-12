"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi, CreateUserData } from "@shared/api/users";
import { toast } from "sonner";
import { ApiError } from "@shared/api/api";

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
        onError: (error: ApiError) => {
            toast.error(error.message || "Failed to create user");
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
        onError: (error: ApiError) => {
            toast.error(error.message || "Failed to delete user");
        },
    });
}

export function useResetTwoFactor() {
    return useMutation({
        mutationFn: (id: number) => usersApi.resetTwoFactor(id),
        onSuccess: () => {
            toast.success("Two-factor authentication reset successfully");
        },
        onError: (error: ApiError) => {
            toast.error(error.message || "Failed to reset 2FA");
        },
    });
}

export function useUpdateUserRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, role }: { id: number; role: string }) => usersApi.updateRole(id, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success("User role updated successfully");
        },
        onError: (error: ApiError) => {
            if (error.status === 403) {
                toast.error("You are not authorized to change this user's role.");
            } else {
                toast.error(error.message || "Failed to update user role");
            }
        },
    });
}
