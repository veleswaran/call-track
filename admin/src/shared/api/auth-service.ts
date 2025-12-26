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
    async login(credentials: LoginCredentials): Promise<void> {
        await api.post("/login", credentials);
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
