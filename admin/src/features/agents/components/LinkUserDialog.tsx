"use client";

import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@shared/components/ui/dialog";
import { Button } from "@shared/components/ui/button";
import { useLinkUser } from "@features/agents/hooks/use-agents";
import { usersApi } from "@shared/api/users";
import { AsyncSelect, Option } from "@shared/components/async-select";
import { toast } from "sonner";
import { Agent } from "@shared/types";
import { Label } from "@shared/components/ui/label";

interface LinkUserDialogProps {
    agent: Agent;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function LinkUserDialog({
    agent,
    open,
    onOpenChange,
}: LinkUserDialogProps) {
    const [selectedUserId, setSelectedUserId] = React.useState<string>("");
    const linkUser = useLinkUser();

    // Map initial user if exists
    React.useEffect(() => {
        if (agent.user_id) {
            setSelectedUserId(agent.user_id.toString());
        } else {
            setSelectedUserId("");
        }
    }, [agent]);

    const loadUsers = async (search: string): Promise<Option[]> => {
        try {
            const response = await usersApi.getUsers(1, 50, search);
            return response.data.map((user) => ({
                label: `${user.name} (${user.email})`,
                value: user.id.toString(),
                // Disable if user is already an agent and it's NOT this agent's current user
                disabled: user.is_agent && user.id !== agent.user_id,
            }));
        } catch (error) {
            console.error("Failed to load users", error);
            return [];
        }
    };

    const handleLink = () => {
        if (!selectedUserId) return;

        linkUser.mutate(
            {
                agentId: agent.id,
                userId: parseInt(selectedUserId),
            },
            {
                onSuccess: () => {
                    toast.success("User linked successfully");
                    onOpenChange(false);
                },
                onError: (error: Error) => {
                    toast.error(error.message || "Failed to link user");
                },
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Link System User</DialogTitle>
                    <DialogDescription>
                        Associate a system user account with sales agent{" "}
                        <span className="font-semibold">{agent.name}</span>.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Search User</Label>
                        <AsyncSelect
                            value={selectedUserId}
                            onChange={setSelectedUserId}
                            loadOptions={loadUsers}
                            placeholder="Select a user..."
                            label="User"
                            className="w-full"
                        />
                        <p className="text-[0.8rem] text-muted-foreground">
                            Users already linked to other agents are disabled.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={linkUser.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleLink}
                        disabled={!selectedUserId || linkUser.isPending}
                    >
                        {linkUser.isPending ? "Linking..." : "Link User"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
