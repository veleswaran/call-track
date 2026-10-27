"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@shared/utils";
import {
    LayoutDashboard,
    BarChart,
    Phone,
    PhoneMissed,
    Smartphone,
    Users,
    UsersRound,
    Contact,
    Settings,
    ChevronLeft,
    Flame,
    type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/src/features/auth/hooks/use-auth";
import { useSettingsQuery } from "@/src/features/settings/hooks/use-settings";

/**
 * Navigation item configuration
 */
export interface NavItem {
    name: string;
    href: string;
    icon: LucideIcon;
    role?: string | string[];
    permission?: string;
}

/**
 * Default navigation items for the admin dashboard
 */
export const defaultNavigation: NavItem[] = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Reports", href: "/reports", icon: BarChart },
    { name: "Customer Summary", href: "/customer-summary", icon: UsersRound },
    { name: "Call Insights", href: "/call-insights", icon: Flame },
    { name: "Missed Calls", href: "/reports/missed-calls", icon: PhoneMissed },
    { name: "Call Logs", href: "/call-logs", icon: Phone },
    { name: "Devices", href: "/devices", icon: Smartphone, permission: "manage devices" }, // or view devices? 'manage devices' is permission name.
    { name: "Users", href: "/users", icon: Users, permission: "manage users" },
    { name: "Teams", href: "/teams", icon: Users, permission: "manage team" },
    { name: "Agents", href: "/agents", icon: Users, permission: "manage team" }, // Managers manage team.
    { name: "Contacts", href: "/contacts", icon: Contact, role: ["admin", "super-admin"] }, // Strict Policy: Only Admin/Super
    { name: "Settings", href: "/settings", icon: Settings, role: ["admin", "super-admin"] }, // Requires Admin config rights
];

export interface SidebarNavProps {
    open: boolean;
    onToggle: () => void;
    navigation?: NavItem[];
}

/**
 * Collapsible sidebar navigation component
 * Displays navigation items with icons, collapses to icon-only on toggle
 */
export function SidebarNav({
    open,
    onToggle,
    navigation = defaultNavigation,
}: SidebarNavProps) {
    const pathname = usePathname();
    const { user } = useAuth();
    const { data: settings } = useSettingsQuery();

    const userRoles: string[] = user?.roles || [];
    const userPermissions: string[] = user?.permissions || [];

    const siteName = settings?.app_sitename || "CallTrack AI";

    return (
        <aside
            data-testid="sidebar"
            className={cn(
                "fixed inset-y-0 left-0 z-30 flex flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-200",
                open ? "w-64" : "w-16"
            )}
        >
            {/* Logo */}
            <div className="flex h-16 items-center translate-x-1 px-4 border-b border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
                        <Smartphone className="h-5 w-5 text-white dark:text-zinc-900" />
                    </div>
                    
                    {open && (
                        <span className="text-lg font-bold text-zinc-900 dark:text-white truncate">
                            {siteName}
                        </span>
                    )}
                </div>

                <div className={cn("ml-auto", !open && "hidden")}>
                    <button
                        onClick={onToggle}
                        data-testid="sidebar-toggle"
                        className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
                    >
                        <ChevronLeft
                            className={cn(
                                "h-4 w-4 transition-transform",
                                !open && "rotate-180"
                            )}
                        />
                    </button>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1" role="navigation">
                {navigation.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (pathname.startsWith(item.href + "/") &&
                            !navigation.some(
                                (other) =>
                                    other.href !== item.href &&
                                    other.href.startsWith(item.href) &&
                                    pathname.startsWith(other.href)
                            ));

                    // Role permission check
                    let isAllowed = true;

                    if (item.role) {
                        const requiredRoles = Array.isArray(item.role) ? item.role : [item.role];
                        isAllowed = requiredRoles.some(r => userRoles.includes(r));
                    }

                    if (isAllowed && item.permission) {
                        isAllowed = userPermissions.includes(item.permission);
                    }

                    if (!isAllowed) return null;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                            )}
                            aria-current={isActive ? "page" : undefined}
                        >
                            <item.icon className="h-5 w-5 shrink-0" />
                            {open && <span>{item.name}</span>}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
