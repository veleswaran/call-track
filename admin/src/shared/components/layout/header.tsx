"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, Bell, User as UserIcon, LogOut } from "lucide-react";
import { Button } from "@shared/components/ui/button";
import { User } from "../../types";

export interface HeaderProps {
    onMenuClick: () => void;
    user?: User;
    onLogout?: () => void;
}

/**
 * Top header bar with menu toggle, notifications, and user menu
 */
export function Header({ onMenuClick, user, onLogout }: HeaderProps) {
    const [userMenuOpen, setUserMenuOpen] = React.useState(false);

    return (
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900 z-50">
            {/* Left side - Logo on mobile, menu toggle on desktop */}
            <div className="flex items-center gap-4">
                <span className="text-lg font-semibold text-zinc-900 dark:text-white md:hidden">
                    CallTrack AI
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onMenuClick}
                    aria-label="Toggle menu"
                    data-testid="menu-toggle"
                    className="hidden md:inline-flex"
                >
                    <Menu className="h-5 w-5" />
                </Button>
            </div>

            {/* Right side - Notifications & User menu */}
            <div className="flex items-center gap-2">
                {/* Notifications placeholder */}
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Notifications"
                    data-testid="notifications-button"
                >
                    <Bell className="h-5 w-5" />
                </Button>

                {/* User menu */}
                <div className="relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        aria-label="User menu"
                        aria-expanded={userMenuOpen}
                        data-testid="user-menu-button"
                    >
                        <UserIcon className="h-5 w-5" />
                    </Button>

                    {userMenuOpen && (
                        <div
                            className="absolute right-0 mt-2 w-48 rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
                            data-testid="user-menu-dropdown"
                        >
                            <div className="px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400">
                                Signed in as
                            </div>
                            <div className="px-4 py-1 text-sm font-medium text-zinc-900 dark:text-white capitalize">
                                {user?.name} ( {user?.roles?.join(", ")} )
                            </div>
                            <hr className="my-1 border-zinc-200 dark:border-zinc-800" />
                            <Link
                                href="/profile"
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                                onClick={() => setUserMenuOpen(false)}
                            >
                                <UserIcon className="h-4 w-4" />
                                Profile
                            </Link>
                            <hr className="my-1 border-zinc-200 dark:border-zinc-800" />
                            {onLogout && (
                                <button
                                    onClick={onLogout}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                                    data-testid="logout-button"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Sign out
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
