import { renderHook, waitFor } from "@testing-library/react";
import { useUsers, useCreateUser, useDeleteUser, useResetTwoFactor, useUpdateUserRole, useUnlinkUserFromAgent } from "./use-users";
import { usersApi } from "@shared/api/users";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach, Mock } from "vitest";
import { toast } from "sonner";
import { ReactNode } from "react";

// Mock API and Toast
vi.mock("@shared/api/users");
vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: false },
    },
});

const createWrapper = () => {
    const Wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    Wrapper.displayName = "TestWrapper";
    return Wrapper;
};

describe("useUsers Hooks", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
    });

    it("fetches users successfully", async () => {
        const mockData = { data: [{ id: 1, name: "User" }], meta: { total: 1 } };
        (usersApi.getUsers as Mock).mockResolvedValue(mockData);

        const { result } = renderHook(() => useUsers(1, 15), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(mockData);
    });

    it("creates user successfully", async () => {
        const mockUser = { id: 1, name: "Test" };
        (usersApi.createUser as Mock).mockResolvedValue(mockUser);

        const { result } = renderHook(() => useCreateUser(), {
            wrapper: createWrapper(),
        });

        result.current.mutate({ name: "Test", email: "test@test.com", password: "password", password_confirmation: "password" });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(toast.success).toHaveBeenCalledWith("User created successfully");
    });

    it("handles create user error", async () => {
        (usersApi.createUser as Mock).mockRejectedValue(new Error("Error"));

        const { result } = renderHook(() => useCreateUser(), {
            wrapper: createWrapper(),
        });

        result.current.mutate({ name: "Test", email: "test@test.com", password: "password", password_confirmation: "password" });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(toast.error).toHaveBeenCalledWith("Error");
    });

    it("deletes user successfully", async () => {
        (usersApi.deleteUser as Mock).mockResolvedValue(undefined);

        const { result } = renderHook(() => useDeleteUser(), {
            wrapper: createWrapper(),
        });

        result.current.mutate(1);

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(toast.success).toHaveBeenCalledWith("User deleted successfully");
    });

    it("resets 2FA successfully", async () => {
        (usersApi.resetTwoFactor as Mock).mockResolvedValue(undefined);

        const { result } = renderHook(() => useResetTwoFactor(), {
            wrapper: createWrapper(),
        });

        result.current.mutate(1);

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(toast.success).toHaveBeenCalledWith("Two-factor authentication reset successfully");
    });

    it("updates user role successfully", async () => {
        (usersApi.updateRole as Mock).mockResolvedValue(undefined);

        const { result } = renderHook(() => useUpdateUserRole(), {
            wrapper: createWrapper(),
        });

        result.current.mutate({ id: 1, role: "admin" });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(toast.success).toHaveBeenCalledWith("User role updated successfully");
    });

    it("handles unauthorized role update error", async () => {
        const error = { status: 403, message: "Use correct error structure" };
        (usersApi.updateRole as Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useUpdateUserRole(), {
            wrapper: createWrapper(),
        });

        result.current.mutate({ id: 1, role: "admin" });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(toast.error).toHaveBeenCalledWith("You are not authorized to change this user's role.");
    });

    it("unlinks user from agent successfully", async () => {
        (usersApi.unlinkUserFromAgent as Mock).mockResolvedValue(undefined);

        const { result } = renderHook(() => useUnlinkUserFromAgent(), {
            wrapper: createWrapper(),
        });

        result.current.mutate({ agentId: 1, userId: 2 });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(toast.success).toHaveBeenCalledWith("User unlinked from agent successfully");
    });

    it("handles unlink user error", async () => {
        (usersApi.unlinkUserFromAgent as Mock).mockRejectedValue(new Error("Unlink failed"));

        const { result } = renderHook(() => useUnlinkUserFromAgent(), {
            wrapper: createWrapper(),
        });

        result.current.mutate({ agentId: 1, userId: 2 });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(toast.error).toHaveBeenCalledWith("Unlink failed");
    });

    it("handles delete user error", async () => {
        (usersApi.deleteUser as Mock).mockRejectedValue(new Error("Delete failed"));

        const { result } = renderHook(() => useDeleteUser(), {
            wrapper: createWrapper(),
        });

        result.current.mutate(1);

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(toast.error).toHaveBeenCalledWith("Delete failed");
    });

    it("handles reset 2FA error", async () => {
        (usersApi.resetTwoFactor as Mock).mockRejectedValue(new Error("Reset failed"));

        const { result } = renderHook(() => useResetTwoFactor(), {
            wrapper: createWrapper(),
        });

        result.current.mutate(1);

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(toast.error).toHaveBeenCalledWith("Reset failed");
    });
});
