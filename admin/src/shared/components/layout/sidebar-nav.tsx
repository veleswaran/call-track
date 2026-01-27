"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@shared/utils";
import {
    LayoutDashboard,
    BarChart,
    Phone,
    Smartphone,
    Users,
    Contact,
    ChevronLeft,
    type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/src/features/auth/hooks/use-auth";

/**
 * Navigation item configuration
 */
export interface NavItem {
    name: string;
    href: string;
    icon: LucideIcon;
    role?: string | string[];
}

/**
 * Default navigation items for the admin dashboard
 */
export const defaultNavigation: NavItem[] = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Reports", href: "/reports", icon: BarChart },
    { name: "Call Logs", href: "/call-logs", icon: Phone },
    { name: "Devices", href: "/devices", icon: Smartphone },
    { name: "Users", href: "/users", icon: Users, role: "admin" },
    { name: "Teams", href: "/teams", icon: Users, role: "admin" },
    { name: "Agents", href: "/agents", icon: Users, role: "admin" },
    { name: "Contacts", href: "/contacts", icon: Contact, role: "admin" },
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

    const userRoles: string[] =
        user?.roles?.map((r: any) => r.name?.toLowerCase()) || [];

    return (
        <aside
            data-testid="sidebar"
            className={cn(
                "flex flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-200",
                open ? "w-64" : "w-16"
            )}
        >
            {/* Logo */}
            <div className="flex h-16 items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800">
                {open && (
                    <span className="text-lg font-semibold text-zinc-900 dark:text-white">
                        CallTrack AI
                    </span>
                )}
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

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1" role="navigation">
                {navigation.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        pathname.startsWith(item.href + "/");

                    // Role permission check
                    const isAllowed = !item.role
                        ? true
                        : Array.isArray(item.role)
                        ? item.role.some((role) =>
                              userRoles.includes(role.toLowerCase())
                          )
                        : userRoles.includes(item.role.toLowerCase());

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
