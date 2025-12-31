import { api } from "./api";
import type { User, LoginCredentials } from "@shared/types";

/**
 * Authentication service for Laravel Sanctum
 * Handles login, logout, and user session
 */
export const authService = {
    /**
     * Login with email and password
     * Laravel Sanctum will set the session cookie
     */
    async login(credentials: LoginCredentials): Promise<{ requires_two_factor?: boolean }> {
        const response = await api.post<{ requires_two_factor?: boolean }>("/login", credentials);
        return response;
    },

    async twoFactorChallenge(code: string): Promise<User> {
        const response = await api.post<{ user: User }>("/api/v1/auth/two-factor/challenge", { code });
        return response.user;
    },

    async enableTwoFactor(): Promise<{ secret: string; qr_code_url: string }> {
        return api.post("/api/v1/auth/two-factor/enable");
    },

    async confirmTwoFactor(secret: string, code: string): Promise<{ recovery_codes: string[] }> {
        return api.post("/api/v1/auth/two-factor/confirm", { secret, code });
    },

    async disableTwoFactor(password: string): Promise<void> {
        await api.post("/api/v1/auth/two-factor/disable", { password });
    },

    async getRecoveryCodes(password: string): Promise<{ recovery_codes: string[] }> {
        return api.post("/api/v1/auth/two-factor/recovery-codes", { password });
    },

    /**
     * Logout and invalidate session
     */
    async logout(): Promise<void> {
        await api.post("/logout");
    },

    /**
     * Get current authenticated user
     * Returns null if not authenticated
     */
    async getCurrentUser(): Promise<User | null> {
        try {
            return await api.get<User>("/api/user");
        } catch {
            return null;
        }
    },
};
