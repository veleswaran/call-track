"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import { Button } from "@shared/components/ui/button";
import { MoreHorizontal, Trash, ShieldAlert } from "lucide-react";
import { useDeleteUser, useResetTwoFactor } from "../hooks/use-users";
import { User } from "@shared/types";
import { useAuth } from "@features/auth/hooks/use-auth";

interface UserActionsProps {
    user: User;
}

export function UserActions({ user }: UserActionsProps) {
    const { user: currentUser } = useAuth();
    const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();
    const { mutate: reset2FA, isPending: isResetting } = useResetTwoFactor();

    const isSelf = currentUser?.id === user.id;

    const handleDelete = () => {
        if (confirm("Are you sure you want to delete this user?")) {
            deleteUser(user.id);
        }
    };

    const handleReset2FA = () => {
        if (confirm("Are you sure you want to reset 2FA for this user?")) {
            reset2FA(user.id);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                    onClick={() => navigator.clipboard.writeText(user.email)}
                >
                    Copy Email
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {user.two_factor_enabled && (
                    <DropdownMenuItem
                        onClick={handleReset2FA}
                        disabled={isResetting}
                        className="text-orange-600 focus:text-orange-600"
                    >
                        <ShieldAlert className="mr-2 h-4 w-4" />
                        Reset 2FA
                    </DropdownMenuItem>
                )}
                {!isSelf && (
                    <DropdownMenuItem
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="text-red-600 focus:text-red-600"
                    >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete User
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
