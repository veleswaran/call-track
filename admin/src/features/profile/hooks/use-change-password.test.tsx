import { renderHook, act } from "@testing-library/react";
import { useChangePassword } from "./use-change-password";
import { profileApi } from "@shared/api/profile";
import { toast } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@shared/api/profile", () => ({
    profileApi: {
        updatePassword: vi.fn(),
    },
}));

vi.mock("sonner", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe("useChangePassword", () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });
        vi.clearAllMocks();
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    it("handles successful password update", async () => {
        vi.mocked(profileApi.updatePassword).mockResolvedValueOnce({} as never);

        const { result } = renderHook(() => useChangePassword(), { wrapper });

        await act(async () => {
            await result.current.mutateAsync({
                current_password: "old",
                password: "new",
                password_confirmation: "new",
            });
        });

        expect(profileApi.updatePassword).toHaveBeenCalledWith({
            current_password: "old",
            password: "new",
            password_confirmation: "new",
        });
        expect(toast.success).toHaveBeenCalledWith("Password updated successfully");
    });

    it("handles password update failure", async () => {
        vi.mocked(profileApi.updatePassword).mockRejectedValueOnce({
            message: "Invalid current password",
        });

        const { result } = renderHook(() => useChangePassword(), { wrapper });

        await act(async () => {
            try {
                await result.current.mutateAsync({
                    current_password: "wrong",
                    password: "new",
                    password_confirmation: "new",
                });
            } catch {
                // Ignore error handled in hook
            }
        });

        expect(toast.error).toHaveBeenCalledWith("Invalid current password");
    });

    it("handles password update failure with fallback message", async () => {
        vi.mocked(profileApi.updatePassword).mockRejectedValueOnce({});

        const { result } = renderHook(() => useChangePassword(), { wrapper });

        await act(async () => {
            try {
                await result.current.mutateAsync({
                    current_password: "wrong",
                    password: "new",
                    password_confirmation: "new",
                });
            } catch {
                // Ignore error handled in hook
            }
        });

        expect(toast.error).toHaveBeenCalledWith("Failed to update password");
    });
});
