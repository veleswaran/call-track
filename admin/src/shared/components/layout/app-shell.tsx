"use client";

import * as React from "react";
import { SidebarNav } from "./sidebar-nav";
import { Header } from "./header";
import { BottomNav } from "./bottom-nav";
import { MobileMenu } from "./mobile-menu";
import { useMobile } from "@shared/hooks/use-mobile";
import { User } from "../../types";

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
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

    const handleToggle = React.useCallback(() => {
        if (isMobile) {
            setMobileMenuOpen((prev) => !prev);
        } else {
            setSidebarOpen((prev) => !prev);
        }
    }, [isMobile]);

    const handleCloseMobileMenu = React.useCallback(() => {
        setMobileMenuOpen(false);
    }, []);

    return (
        <div
            className="flex h-screen bg-zinc-50 dark:bg-zinc-950"
            data-testid="app-shell"
        >
            {/* Desktop sidebar - hidden on mobile */}
            {!isMobile && <SidebarNav open={sidebarOpen} onToggle={handleToggle} />}

            <div className="flex flex-1 flex-col overflow-hidden">
                <Header
                    onMenuClick={handleToggle}
                    user={user}
                    onLogout={!isMobile ? onLogout : undefined}
                />
                {/* Main content - extra bottom padding on mobile for bottom nav */}
                <main
                    className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6"
                    data-testid="main-content"
                >
                    {children}
                </main>
            </div>

            {/* Mobile bottom navigation */}
            {isMobile && <BottomNav />}

            {/* Mobile slide-out menu for secondary nav */}
            {isMobile && (
                <MobileMenu
                    open={mobileMenuOpen}
                    onClose={handleCloseMobileMenu}
                    onLogout={onLogout}
                />
            )}
        </div>
    );
}
