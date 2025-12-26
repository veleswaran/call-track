"use client";

import * as React from "react";
import { SidebarNav } from "./sidebar-nav";
import { Header } from "./header";

export interface AppShellProps {
    children: React.ReactNode;
    userName?: string;
    onLogout?: () => void;
}

/**
 * Main authenticated shell layout
 * Provides consistent layout with sidebar navigation and header
 */
export function AppShell({ children, userName, onLogout }: AppShellProps) {
    const [sidebarOpen, setSidebarOpen] = React.useState(true);

    const handleToggle = React.useCallback(() => {
        setSidebarOpen((prev) => !prev);
    }, []);

    return (
        <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950" data-testid="app-shell">
            <SidebarNav open={sidebarOpen} onToggle={handleToggle} />
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header
                    onMenuClick={handleToggle}
                    userName={userName}
                    onLogout={onLogout}
                />
                <main className="flex-1 overflow-y-auto p-6" data-testid="main-content">
                    {children}
                </main>
            </div>
        </div>
    );
}
