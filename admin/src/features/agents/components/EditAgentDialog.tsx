"use client";

import { useState } from "react";
import { Button } from "@shared/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@shared/components/ui/dialog";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@shared/components/ui/select";
import { useUpdateAgent } from "../hooks/use-agents";
import type { Agent } from "@shared/types";

interface EditAgentDialogProps {
    agent: Agent;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/**
 * Dialog for editing an existing agent
 */
export function EditAgentDialog({ agent, open, onOpenChange }: EditAgentDialogProps) {
    const [name, setName] = useState(agent.name);
    const [employeeCode, setEmployeeCode] = useState(agent.employee_code ?? "");
    const [status, setStatus] = useState<"active" | "inactive">(agent.status);

    const updateAgent = useUpdateAgent();

    // Reset form when dialog opens with new agent
    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen) {
            // Reset form to agent values when opening
            setName(agent.name);
            setEmployeeCode(agent.employee_code ?? "");
            setStatus(agent.status);
        }
        onOpenChange(isOpen);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) return;

        try {
            await updateAgent.mutateAsync({
                id: agent.id,
                data: {
                    name: name.trim(),
                    employee_code: employeeCode.trim() || undefined,
                    status,
                },
            });

            onOpenChange(false);
        } catch {
            // Error handled by mutation
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Agent</DialogTitle>
                    <DialogDescription>
                        Update agent details.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-name">Name *</Label>
                        <Input
                            id="edit-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-employeeCode">Employee Code</Label>
                        <Input
                            id="edit-employeeCode"
                            value={employeeCode}
                            onChange={(e) => setEmployeeCode(e.target.value)}
                            placeholder="EMP001"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-status">Status</Label>
                        <Select value={status} onValueChange={(v) => setStatus(v as "active" | "inactive")}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={updateAgent.isPending}>
                            {updateAgent.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
