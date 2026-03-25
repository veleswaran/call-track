"use client";

import { useState } from "react";
import { Button } from "@shared/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { Plus } from "lucide-react";
import { useCreateAgent } from "../hooks/use-agents";
import { useAgentStatuses } from "../hooks/use-agent-statuses";
import { useEffect } from "react";

interface AddAgentDialogProps {
    trigger?: React.ReactNode;
}

/**
 * Dialog for adding a new agent
 */
export function AddAgentDialog({ trigger }: AddAgentDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [employeeCode, setEmployeeCode] = useState("");
    const [statusId, setStatusId] = useState<string>("");

    const createAgent = useCreateAgent();
    const { data: statusesData } = useAgentStatuses();
    const statuses = statusesData?.data ?? [];

    const [prevStatusesLength, setPrevStatusesLength] = useState(0);

    if (statuses.length > 0 && statuses.length !== prevStatusesLength) {
        setPrevStatusesLength(statuses.length);
        if (!statusId) {
            const defaultStatus = statuses.find(s => s.is_default) || statuses[0];
            setStatusId(defaultStatus.id.toString());
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) return;

        try {
            await createAgent.mutateAsync({
                name: name.trim(),
                employee_code: employeeCode.trim() || undefined,
                agent_status_id: statusId ? parseInt(statusId) : undefined,
            });

            // Reset form and close
            setName("");
            setEmployeeCode("");
            setStatusId("");
            setOpen(false);
        } catch {
            // Error handled by mutation
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ?? (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Agent
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Agent</DialogTitle>
                    <DialogDescription>
                        Create a new sales agent. They can be assigned to devices to track performance.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="employeeCode">Employee Code</Label>
                        <Input
                            id="employeeCode"
                            value={employeeCode}
                            onChange={(e) => setEmployeeCode(e.target.value)}
                            placeholder="EMP001"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={statusId} onValueChange={setStatusId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                {statuses.map((s) => (
                                    <SelectItem key={s.id} value={s.id.toString()}>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                                            {s.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createAgent.isPending}>
                            {createAgent.isPending ? "Creating..." : "Create Agent"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
