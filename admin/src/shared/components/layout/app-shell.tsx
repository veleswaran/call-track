"use client";

import * as React from "react";
import { SidebarNav } from "./sidebar-nav";
import { Header } from "./header";
import { BottomNav } from "./bottom-nav";
import { useMobile } from "@shared/hooks/use-mobile";
import { User } from "../../types";
import { cn } from "@shared/utils";

export interface AppShellProps {
    children: React.ReactNode;
    user?: User;
    onLogout?: () => void;
}

/**
 * Main authenticated shell layout
 * - Desktop: Sidebar navigation on left
 * - Mobile: Bottom navigation bar + hamburger menu for secondary nav
 */
export function AppShell({ children, user, onLogout }: AppShellProps) {
    const isMobile = useMobile();
    const [sidebarOpen, setSidebarOpen] = React.useState(true);

    const handleToggle = React.useCallback(() => {
        setSidebarOpen((prev) => !prev);
    }, []);

    return (
        <div
            className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950"
            data-testid="app-shell"
        >
            {/* Desktop sidebar - hidden on mobile */}
            {!isMobile && <SidebarNav open={sidebarOpen} onToggle={handleToggle} />}

            <div 
                className={cn(
                    "flex flex-1 flex-col min-h-screen transition-all duration-200",
                    !isMobile && (sidebarOpen ? "pl-64" : "pl-16")
                )}
            >
                <Header
                    onMenuClick={handleToggle}
                    user={user}
                    onLogout={!isMobile ? onLogout : undefined}
                />
                {/* Main content - extra bottom padding on mobile for bottom nav */}
                <main
                    className="flex-1 p-4 pb-20 md:p-6 md:pb-6"
                    data-testid="main-content"
                >
                    {children}
                </main>
            </div>

            {/* Mobile bottom navigation */}
            {isMobile && <BottomNav onLogout={onLogout} />}
        </div>
    );
}
