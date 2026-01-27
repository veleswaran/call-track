"use client";

import { AppShell } from "@shared/components/layout/app-shell";
import { AuthGuard } from "@shared/components/auth/auth-guard";
import { authService } from "@shared/api/auth-service";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/features/auth/hooks/use-auth";

export default function DashboardLayout({ children,}: {    children: React.ReactNode;}) {
    const {user} = useAuth();
    console.log(user);
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await authService.logout();
            router.push("/login");
        } catch {
            // Still redirect on error - session may already be expired
            router.push("/login");
        }
    };

    return (
        <AuthGuard>
            <AppShell onLogout={handleLogout} user={user ?? undefined}>{children}</AppShell>
        </AuthGuard>
    );
}
