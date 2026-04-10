"use client";

import * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@shared/api/query-client";
import { Toaster } from "@shared/components/ui/sonner";

import { ThemeProvider } from "@shared/components/theme-provider";

import { SiteTitleUpdater } from "./site-title-updater";

/**
 * Global providers for the application
 * Includes TanStack Query provider and Theme provider
 */
export function Providers({ children }: { children: React.ReactNode }) {
    // Create QueryClient once per component lifecycle
    const [queryClient] = React.useState(() => createQueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                <SiteTitleUpdater />
                {children}
                <Toaster />
            </ThemeProvider>
        </QueryClientProvider>
    );
}
