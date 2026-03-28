"use client";

import { useState } from "react";
import { Button } from "@shared/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@shared/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@shared/components/ui/select";
import { Label } from "@shared/components/ui/label";
import { User } from "@shared/types";
import { useAuth } from "@features/auth/hooks/use-auth";
import { useUpdateUserRole } from "../hooks/use-users";

interface ChangeRoleDialogProps {
    user: User;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ChangeRoleDialog({ user, open, onOpenChange }: ChangeRoleDialogProps) {
    const [role, setRole] = useState(user.roles?.[0] || "member");
    const { user: currentUser } = useAuth();
    const { mutate: updateRole, isPending } = useUpdateUserRole();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateRole(
            { id: user.id, role },
            {
                onSuccess: () => {
                    onOpenChange(false);
                },
            }
        );
    };

    // Filter available roles based on current user's role (Frontend Logic)
    // Detailed validation happens in Backend.
    const isSuperAdmin = currentUser?.roles?.includes("super-admin");
    const isAdmin = currentUser?.roles?.includes("admin");

    let availableRoles: string[] = [];
    if (isSuperAdmin) {
        availableRoles = ["super-admin", "admin", "manager", "member"];
    } else if (isAdmin) {
        availableRoles = ["manager", "member"];
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Change User Role</DialogTitle>
                    <DialogDescription>
                        Update the role for {user.name}. careful, this affects their permissions.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="role" className="text-right">
                                Role
                            </Label>
                            <Select
                                value={role}
                                onValueChange={setRole}
                                disabled={availableRoles.length === 0}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableRoles.map((r) => (
                                        <SelectItem key={r} value={r}>
                                            {r.charAt(0).toUpperCase() + r.slice(1).replace('-', ' ')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending || availableRoles.length === 0}>
                            {isPending ? "Saving..." : "Save changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
