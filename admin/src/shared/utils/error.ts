import type { ApiError } from "@shared/api/api";
import type { ApiErrorResponse } from "@shared/types";

/**
 * Type guard interface for API error responses (e.g., Axios-style errors).
 */
interface AxiosStyleApiError {
    response?: {
        data?: {
            message?: string;
            errors?: Record<string, string[]>;
        };
    };
    message?: string;
}

/**
 * Type guard to check if an unknown error conforms to the Axios-style API error shape.
 */
function isAxiosStyleApiError(error: unknown): error is AxiosStyleApiError {
    return (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as Record<string, unknown>).response === "object"
    );
}

function isApiErrorResponse(data: unknown): data is ApiErrorResponse {
    return typeof data === "object" && data !== null;
}

/**
 * Flattens Laravel validation errors into a single human-readable string.
 */
export function formatValidationErrors(
    errors: Record<string, string[]>
): string {
    return Object.values(errors).flat().join(" ");
}

/**
 * Safely extracts a human-readable message from an unknown error.
 * Prefers specific Laravel validation errors over generic messages.
 */
export function getApiErrorMessage(
    error: unknown,
    fallback = "An error occurred"
): string {
    if (error instanceof Error) {
        const apiError = error as ApiError;

        if (isApiErrorResponse(apiError.data)) {
            if (apiError.data.errors && Object.keys(apiError.data.errors).length > 0) {
                return formatValidationErrors(apiError.data.errors);
            }

            if (apiError.data.message) {
                return apiError.data.message;
            }
        }

        return error.message || fallback;
    }

    if (isAxiosStyleApiError(error)) {
        const data = error.response?.data;

        if (data?.errors && Object.keys(data.errors).length > 0) {
            return formatValidationErrors(data.errors);
        }

        return data?.message || error.message || fallback;
    }

    return fallback;
}
