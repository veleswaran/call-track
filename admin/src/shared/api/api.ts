const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ApiError extends Error {
    status?: number;
    data?: unknown;
}

/**
 * Creates an API error with status code
 */
function createApiError(message: string, status?: number, data?: unknown): ApiError {
    const error = new Error(message) as ApiError;
    error.status = status;
    error.data = data;
    return error;
}

/**
 * API client configured for Laravel Sanctum cookie-based authentication
 * All requests include credentials for cross-origin cookie handling
 */
/**
 * Helper to get cookie by name
 */
function getCookie(name: string): string | null {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
    return null;
}

/**
 * Get headers with CSRF token
 */
function getHeaders(contentType = "application/json"): HeadersInit {
    const headers: Record<string, string> = {
        Accept: "application/json",
    };

    if (contentType) {
        headers["Content-Type"] = contentType;
    }

    const xsrfToken = getCookie("XSRF-TOKEN");
    if (xsrfToken) {
        headers["X-XSRF-TOKEN"] = decodeURIComponent(xsrfToken);
    }

    return headers;
}

export const api = {
    baseUrl: API_BASE_URL,

    async getCsrfCookie(): Promise<void> {
        await fetch(`${API_BASE_URL}/sanctum/csrf-cookie`, {
            credentials: "include",
        });
    },

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

    async post<T>(endpoint: string, data?: unknown): Promise<T> {
        await this.getCsrfCookie();

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: "POST",
            credentials: "include",
            headers: getHeaders(),
            body: data ? JSON.stringify(data) : undefined,
        });

        if (!response.ok) {
            throw createApiError(response.statusText, response.status);
        }

        return response.json();
    },

    async put<T>(endpoint: string, data?: unknown): Promise<T> {
        await this.getCsrfCookie();

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: "PUT",
            credentials: "include",
            headers: getHeaders(),
            body: data ? JSON.stringify(data) : undefined,
        });

        if (!response.ok) {
            throw createApiError(response.statusText, response.status);
        }

        return response.json();
    },

    async delete<T>(endpoint: string): Promise<T> {
        await this.getCsrfCookie();

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: "DELETE",
            credentials: "include",
            headers: getHeaders(),
        });

        if (!response.ok) {
            throw createApiError(response.statusText, response.status);
        }

        return response.json();
    },
};

export type { ApiError };
