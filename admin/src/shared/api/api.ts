const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ApiError extends Error {
    status?: number;
}

/**
 * Creates an API error with status code
 */
function createApiError(message: string, status?: number): ApiError {
    const error = new Error(message) as ApiError;
    error.status = status;
    return error;
}

/**
 * API client configured for Laravel Sanctum cookie-based authentication
 * All requests include credentials for cross-origin cookie handling
 */
export const api = {
    baseUrl: API_BASE_URL,

    /**
     * Fetches the CSRF cookie from Laravel Sanctum
     * Must be called before any state-changing requests (POST, PUT, DELETE)
     */
    async getCsrfCookie(): Promise<void> {
        await fetch(`${API_BASE_URL}/sanctum/csrf-cookie`, {
            credentials: "include",
        });
    },

    /**
     * Performs a GET request
     */
    async get<T>(endpoint: string): Promise<T> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            credentials: "include",
            headers: {
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            throw createApiError(response.statusText, response.status);
        }

        return response.json();
    },

    /**
     * Performs a POST request with CSRF token handling
     */
    async post<T>(endpoint: string, data?: unknown): Promise<T> {
        await this.getCsrfCookie();

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: "POST",
            credentials: "include",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: data ? JSON.stringify(data) : undefined,
        });

        if (!response.ok) {
            throw createApiError(response.statusText, response.status);
        }

        return response.json();
    },

    /**
     * Performs a PUT request with CSRF token handling
     */
    async put<T>(endpoint: string, data?: unknown): Promise<T> {
        await this.getCsrfCookie();

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: "PUT",
            credentials: "include",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: data ? JSON.stringify(data) : undefined,
        });

        if (!response.ok) {
            throw createApiError(response.statusText, response.status);
        }

        return response.json();
    },

    /**
     * Performs a DELETE request with CSRF token handling
     */
    async delete<T>(endpoint: string): Promise<T> {
        await this.getCsrfCookie();

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: "DELETE",
            credentials: "include",
            headers: {
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            throw createApiError(response.statusText, response.status);
        }

        return response.json();
    },
};

export type { ApiError };
