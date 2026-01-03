"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Contact, Settings, LogOut } from "lucide-react";
import { cn } from "@shared/utils";
import { Button } from "@shared/components/ui/button";

export interface MobileMenuProps {
    open: boolean;
    onClose: () => void;
    onLogout?: () => void;
}

/**
 * Secondary navigation items for mobile menu
 */
const menuItems = [
    { name: "Contacts", href: "/contacts", icon: Contact },
    { name: "Settings", href: "/settings", icon: Settings },
] as const;

/**
 * Mobile slide-out menu for secondary navigation
 * Contains: Contacts, Settings, Logout
 */
export function MobileMenu({ open, onClose, onLogout }: MobileMenuProps) {
    const pathname = usePathname();

    // Close menu on escape key
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        if (open) {
            document.addEventListener("keydown", handleEscape);
            // Prevent body scroll when menu is open
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "";
        };
    }, [open, onClose]);

    const isActive = (href: string) => pathname.startsWith(href);

    if (!open) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-black/50 md:hidden"
                onClick={onClose}
                data-testid="mobile-menu-backdrop"
                aria-hidden="true"
            />

            {/* Menu panel */}
            <div
                className="fixed inset-y-0 right-0 z-50 w-64 bg-white dark:bg-zinc-950 shadow-xl md:hidden"
                data-testid="mobile-menu"
                role="dialog"
                aria-modal="true"
                aria-label="Navigation menu"
            >
                {/* Header */}
                <div className="flex h-14 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
                    <span className="text-sm font-semibold">Menu</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        aria-label="Close menu"
                        data-testid="mobile-menu-close"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Navigation links */}
                <nav className="flex flex-col p-4">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                    active
                                        ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                                )}
                                data-testid={`mobile-menu-${item.name.toLowerCase()}`}
                            >
                                <Icon className="h-5 w-5" />
                                {item.name}
                            </Link>
                        );
                    })}

                    {/* Logout button */}
                    {onLogout && (
                        <button
                            onClick={() => {
                                onLogout();
                                onClose();
                            }}
                            className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                            data-testid="mobile-menu-logout"
                        >
                            <LogOut className="h-5 w-5" />
                            Logout
                        </button>
                    )}
                </nav>
            </div>
        </>
    );
}

export { menuItems };
