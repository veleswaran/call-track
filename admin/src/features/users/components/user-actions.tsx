"use client";

import { useState } from "react";
import { ChangeRoleDialog } from "./change-role-dialog";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import { Button } from "@shared/components/ui/button";
import { MoreHorizontal, Trash, ShieldAlert, Unlink } from "lucide-react";
import { useDeleteUser, useResetTwoFactor, useUnlinkUserFromAgent } from "../hooks/use-users";
import { User } from "@shared/types";
import { useAuth } from "@features/auth/hooks/use-auth";

interface UserActionsProps {
    user: User;
}

export function UserActions({ user }: UserActionsProps) {
    const { user: currentUser } = useAuth();
    const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();
    const { mutate: reset2FA, isPending: isResetting } = useResetTwoFactor();
    const { mutate: unlinkUser, isPending: isUnlinking } = useUnlinkUserFromAgent();
    const [showRoleDialog, setShowRoleDialog] = useState(false);

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

    const handleUnlink = () => {
        if (user.agent?.id && confirm(`Are you sure you want to unlink this user from agent ${user.agent.name}?`)) {
            unlinkUser({ agentId: user.agent.id, userId: user.id });
        }
    };

    const canUnlinkAgent = user.agent &&
        !isSelf &&
        (currentUser?.roles?.includes("super-admin") || currentUser?.roles?.includes("admin"));

    return (
        <>
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

                    {/* Role Change Logic:
                        1. No one can change Super Admin role (even other Super Admins via this UI)
                        2. Admins cannot change other Admins
                     */}
                    {!isSelf && (
                        (currentUser?.roles?.includes("super-admin") && !user.roles?.includes("super-admin")) ||
                        (currentUser?.roles?.includes("admin") && !user.roles?.includes("super-admin") && !user.roles?.includes("admin"))
                    ) && (
                            <DropdownMenuItem
                                onSelect={() => setShowRoleDialog(true)}
                            >
                                <ShieldAlert className="mr-2 h-4 w-4" />
                                Change Role
                            </DropdownMenuItem>
                        )}

                    {/* Unlink User from Agent Logic */}
                    {canUnlinkAgent && (
                        <DropdownMenuItem
                            onClick={handleUnlink}
                            disabled={isUnlinking}
                            className="text-amber-600 focus:text-amber-600"
                        >
                            <Unlink className="mr-2 h-4 w-4" />
                            Unlink Agent
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    {/* Strict RBAC: Only Super Admin can delete */}
                    {!isSelf && currentUser?.permissions?.includes("delete records") && (
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
            </DropdownMenu >

            <ChangeRoleDialog
                user={user}
                open={showRoleDialog}
                onOpenChange={setShowRoleDialog}
            />
        </>
    );
}
