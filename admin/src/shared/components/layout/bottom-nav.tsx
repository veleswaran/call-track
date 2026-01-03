"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Phone, Smartphone, Users } from "lucide-react";
import { cn } from "@shared/utils";

/**
 * Primary navigation items for bottom bar
 */
const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Calls", href: "/call-logs", icon: Phone },
    { name: "Devices", href: "/devices", icon: Smartphone },
    { name: "Agents", href: "/agents", icon: Users },
] as const;

export type BottomNavItem = (typeof navItems)[number];

/**
 * Mobile bottom navigation bar
 * Shows 4 primary navigation links at the bottom of the screen
 * Only visible on mobile viewports (md:hidden)
 */
export function BottomNav() {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === "/") {
            return pathname === "/";
        }
        return pathname.startsWith(href);
    };

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 md:hidden"
            data-testid="bottom-nav"
            role="navigation"
            aria-label="Primary navigation"
        >
            <div className="flex h-16 items-center justify-around">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
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
            </div>
        </nav>
    );
}

export { navItems };
