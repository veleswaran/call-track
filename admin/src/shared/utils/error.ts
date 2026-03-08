/**
 * Type guard interface for API error responses (e.g., Axios-style errors).
 */
interface ApiErrorResponse {
    response?: {
        data?: {
            message?: string;
        };
    };
    message?: string;
}

/**
 * Type guard to check if an unknown error conforms to the API error shape.
 */
function isApiError(error: unknown): error is ApiErrorResponse {
    return (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as Record<string, unknown>).response === "object"
    );
}

/**
 * Safely extracts a human-readable message from an unknown error.
 * Checks for Axios-style `error.response.data.message`, then falls back to
 * native `Error.message`, and finally to the provided fallback string.
 */
export function getApiErrorMessage(error: unknown, fallback = "An error occurred"): string {
    if (isApiError(error)) {
        return error.response?.data?.message || fallback;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return fallback;
}
