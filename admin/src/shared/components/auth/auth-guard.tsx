"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { authService } from "@shared/api/auth-service";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = React.useState(true);
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);

    React.useEffect(() => {
        checkAuth();
    }, [pathname]);

    const checkAuth = async () => {
        try {
            const user = await authService.getCurrentUser();
            if (!user) {
                // If checking /login, user is null is fine (let them login)
                // But this guard is for PROTECTED routes.
                // So if user is null, redirect to login.
                throw new Error("Unauthenticated");
            }
            setIsAuthenticated(true);
        } catch (error) {
            setIsAuthenticated(false);
            console.log("AuthGuard: Unauthenticated, redirecting to login");
            router.push("/login");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-900 border-t-transparent dark:border-zinc-50"></div>
                    <p className="mt-2 text-sm text-zinc-500">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}
