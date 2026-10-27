"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Phone, Smartphone, Users, UsersRound, BarChart, Menu, Contact, Settings, X, LogOut, PhoneMissed, Flame } from "lucide-react";
import { cn } from "@shared/utils";
import { useAuth } from "@/src/features/auth/hooks/use-auth";

/**
 * Primary navigation items shown directly in the bottom bar
 */
const primaryNavItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Reports", href: "/reports", icon: BarChart },
    { name: "Calls", href: "/call-logs", icon: Phone },
    { name: "Devices", href: "/devices", icon: Smartphone, permission: "manage devices" },
] as const;

/**
 * Overflow navigation items shown in the "More" menu
 */
const moreNavItems = [
    { name: "Call Insights", href: "/call-insights", icon: Flame },
    { name: "Customer Summary", href: "/customer-summary", icon: UsersRound },
    { name: "Missed Calls", href: "/reports/missed-calls", icon: PhoneMissed },
    { name: "Teams", href: "/teams", icon: Users, permission: "manage team" },
    { name: "Users", href: "/users", icon: Users, permission: "manage users" },
    { name: "Agents", href: "/agents", icon: Users, permission: "manage team" },
    { name: "Contacts", href: "/contacts", icon: Contact, role: ["admin", "super-admin"] },
    { name: "Settings", href: "/settings", icon: Settings, role: ["admin", "super-admin"] },
] as const;


export const navItems = [...primaryNavItems, ...moreNavItems];

export type BottomNavItem = (typeof navItems)[number];

export interface BottomNavProps {
    onLogout?: () => void;
}

export function BottomNav({ onLogout }: BottomNavProps) {
    const pathname = usePathname();
    const [moreOpen, setMoreOpen] = useState(false);
    const { user } = useAuth();
    const userRoles: string[] = user?.roles || [];
    const userPermissions: string[] = user?.permissions || [];

    const isActive = (href: string) => {
        if (href === "/") {
            return pathname === "/";
        }
        return pathname.startsWith(href);
    };

    const isItemAllowed = (item: BottomNavItem) => {
        let isAllowed = true;
        const navItem = item as { role?: string | string[], permission?: string };

        if (navItem.role) {
            const requiredRoles = Array.isArray(navItem.role) ? navItem.role : [navItem.role];
            isAllowed = requiredRoles.some((r: string) => userRoles.includes(r));
        }

        if (isAllowed && navItem.permission) {
            isAllowed = userPermissions.includes(navItem.permission);
        }

        return isAllowed;
    };

    const allowedPrimaryNavItems = primaryNavItems.filter(isItemAllowed);
    const allowedMoreNavItems = moreNavItems.filter(isItemAllowed);

    const isMoreActive = allowedMoreNavItems.some((item) => isActive(item.href));

    return (
        <>
            {/* Overlay backdrop when More menu is open */}
            {moreOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/30 md:hidden"
                    onClick={() => setMoreOpen(false)}
                />
            )}

            {/* More menu slide-up panel */}
            {moreOpen && (
                <div className="fixed bottom-16 left-0 right-0 z-50 border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 md:hidden rounded-t-xl shadow-lg animate-in slide-in-from-bottom-4 duration-200">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">More</span>
                        <button
                            onClick={() => setMoreOpen(false)}
                            className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            aria-label="Close menu"
                        >
                            <X className="h-4 w-4 text-zinc-500" />
                        </button>
                    </div>
                    <nav className="p-2 space-y-1">
                        {allowedMoreNavItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMoreOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                        active
                                            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                                            : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                                    )}
                                    aria-current={active ? "page" : undefined}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}

                        {/* Logout button */}
                        {onLogout && (
                            <button
                                onClick={() => {
                                    onLogout();
                                    setMoreOpen(false);
                                }}
                                className="mt-2 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 w-full"
                                data-testid="bottom-nav-logout"
                            >
                                <LogOut className="h-5 w-5" />
                                Logout
                            </button>
                        )}
                    </nav>
                </div>
            )}

            {/* Bottom navigation bar */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 md:hidden"
                data-testid="bottom-nav"
                role="navigation"
                aria-label="Primary navigation"
            >
                <div className="flex h-16 items-center justify-around">
                    {allowedPrimaryNavItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMoreOpen(false)}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 px-3 py-2 text-zinc-500 transition-colors",
                                    active && "text-zinc-900 dark:text-zinc-50",
                                    !active && "hover:text-zinc-700 dark:hover:text-zinc-300"
                                )}
                                aria-current={active ? "page" : undefined}
                                data-testid={`bottom-nav-${item.name.toLowerCase()}`}
                            >
                                <Icon className="h-5 w-5" />
                                <span className="text-xs font-medium">{item.name}</span>
                            </Link>
                        );
                    })}

                    {/* More / Hamburger button */}
                    <button
                        onClick={() => setMoreOpen((prev) => !prev)}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 px-3 py-2 text-zinc-500 transition-colors",
                            (moreOpen || isMoreActive) && "text-zinc-900 dark:text-zinc-50",
                            !(moreOpen || isMoreActive) && "hover:text-zinc-700 dark:hover:text-zinc-300"
                        )}
                        data-testid="bottom-nav-more"
                        aria-label="More navigation items"
                        aria-expanded={moreOpen}
                    >
                        <Menu className="h-5 w-5" />
                        <span className="text-xs font-medium">More</span>
                    </button>
                </div>
            </nav>
        </>
    );
}
