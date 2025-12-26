"use client";

import { AppShell } from "@shared/components/layout/app-shell";
import { authService } from "@shared/api/auth-service";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
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

    return <AppShell onLogout={handleLogout}>{children}</AppShell>;
}
