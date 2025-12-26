import { QueryClient } from "@tanstack/react-query";

/**
 * Creates a configured QueryClient for TanStack Query
 * Used in both client and server components
 */
export function createQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // Stale time of 60 seconds for better caching
                staleTime: 60 * 1000,
                // Retry failed requests up to 3 times
                retry: 3,
                // Don't refetch on window focus for enterprise admin
                refetchOnWindowFocus: false,
            },
            mutations: {
                // Retry mutations once on failure
                retry: 1,
            },
        },
    });
}
