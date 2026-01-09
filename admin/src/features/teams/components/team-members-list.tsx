"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Shield, User, MoreHorizontal, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@shared/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@shared/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@shared/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@shared/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import { Label } from "@shared/components/ui/label";
import { teamsApi } from "../api/teams-api";
import { api } from "@shared/api/api";
import { AsyncSelect } from "@shared/components/async-select";

interface TeamMembersListProps {
    teamId: number;
}

export function TeamMembersList({ teamId }: TeamMembersListProps) {
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();

    // Fetch team details to get members
    const { data: teamData, isLoading } = useQuery({
        queryKey: ["team", teamId],
        queryFn: () => teamsApi.getTeam(teamId),
    });

    const members = teamData?.data.members || [];
    const existingAgentIds = members.map((m) => m.agent_id);

    const removeMutation = useMutation({
        mutationFn: (agentId: number) => teamsApi.removeMember(teamId, agentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["team", teamId] });
        },
    });

    const updateRoleMutation = useMutation({
        mutationFn: ({ agentId, role }: { agentId: number; role: "MANAGER" | "MEMBER" }) =>
            teamsApi.updateMemberRole(teamId, agentId, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["team", teamId] });
        },
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Members</h3>
                <AddMemberDialog
                    teamId={teamId}
                    existingAgentIds={existingAgentIds}
                    isOpen={isOpen}
                    onOpenChange={setIsOpen}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ["team", teamId] });
                        setIsOpen(false);
                    }}
                />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : members.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                    No members found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            members.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell>{member.agent?.name || "Unknown Agent"}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${member.role === "MANAGER"
                                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                                            }`}>
                                            {member.role === "MANAGER" ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                                            {member.role}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(member.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => updateRoleMutation.mutate({
                                                        agentId: member.agent_id,
                                                        role: member.role === "MANAGER" ? "MEMBER" : "MANAGER"
                                                    })}
                                                    disabled={updateRoleMutation.isPending}
                                                >
                                                    <RefreshCw className="mr-2 h-4 w-4" />
                                                    {member.role === "MANAGER" ? "Demote to Member" : "Promote to Manager"}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => removeMutation.mutate(member.agent_id)}
                                                    disabled={removeMutation.isPending}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Remove from Team
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

function AddMemberDialog({
    teamId,
    existingAgentIds,
    isOpen,
    onOpenChange,
    onSuccess,
}: {
    teamId: number;
    existingAgentIds: number[];
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}) {
    const [selectedAgentId, setSelectedAgentId] = useState<string>("");
    const [role, setRole] = useState<"MEMBER" | "MANAGER">("MEMBER");

    const mutation = useMutation({
        mutationFn: () =>
            teamsApi.addMember(teamId, {
                agent_id: parseInt(selectedAgentId),
                role,
            }),
        onSuccess,
    });

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Member
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Team Member</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Agent</Label>
                        <AsyncSelect
                            loadOptions={async (query) => {
                                const res = await api.get<{ data: { id: number; name: string }[] }>(`/api/v1/admin/agents?per_page=20&search=${query}`);
                                // Filter out agents already in the team
                                return res.data
                                    .filter((agent) => !existingAgentIds.includes(agent.id))
                                    .map((agent) => ({
                                        value: agent.id.toString(),
                                        label: agent.name,
                                    }));
                            }}
                            value={selectedAgentId}
                            onChange={setSelectedAgentId}
                            placeholder="Select agent..."
                            label="Agent"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Role</Label>
                        <Select
                            value={role}
                            onValueChange={(val) => setRole(val as "MEMBER" | "MANAGER")}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MEMBER">Member</SelectItem>
                                <SelectItem value="MANAGER">Manager</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        onClick={() => mutation.mutate()}
                        disabled={!selectedAgentId || mutation.isPending}
                    >
                        {mutation.isPending ? "Adding..." : "Add Member"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
