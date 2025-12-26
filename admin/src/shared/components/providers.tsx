"use client";

import * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@shared/api/query-client";

/**
 * Global providers for the application
 * Includes TanStack Query provider with proper client management
 */
export function Providers({ children }: { children: React.ReactNode }) {
    // Create QueryClient once per component lifecycle
    const [queryClient] = React.useState(() => createQueryClient());

    return (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
}
