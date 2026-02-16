"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@features/auth/hooks/use-auth";
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
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { teamsApi } from "../api/teams-api";

export function TeamList() {
    const [page] = useState(1);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const queryClient = useQueryClient();

    const { user } = useAuth();
    const isAdmin = user?.roles.some((role: string) => ['admin', 'super-admin'].includes(role));

    const { data: teamsData, isLoading } = useQuery({
        queryKey: ["teams", page],
        queryFn: () => teamsApi.getTeams({ page }),
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Teams</h2>
                {isAdmin && (
                    <CreateTeamDialog
                        open={isCreateOpen}
                        onOpenChange={setIsCreateOpen}
                        onSuccess={() => {
                            queryClient.invalidateQueries({ queryKey: ["teams"] });
                            setIsCreateOpen(false);
                        }}
                    />
                )}
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Managers</TableHead>
                            <TableHead>Members</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                            </TableRow>
                        ) : teamsData?.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">No teams found.</TableCell>
                            </TableRow>
                        ) : (
                            teamsData?.data.map((team) => (
                                <TableRow key={team.id}>
                                    <TableCell className="font-medium">{team.name}</TableCell>
                                    <TableCell>{team.managers_count || 0}</TableCell>
                                    <TableCell>{team.members_count || 0}</TableCell>
                                    <TableCell>{new Date(team.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/teams/${team.id}`}>View</Link>
                                        </Button>
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

function CreateTeamDialog({
    open,
    onOpenChange,
    onSuccess
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}) {
    const [name, setName] = useState("");

    const mutation = useMutation({
        mutationFn: () => teamsApi.createTeam({ name }),
        onSuccess,
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Team
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Team</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Team Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Sales Alpha"
                        />
                    </div>
                    <Button
                        onClick={() => mutation.mutate()}
                        disabled={!name || mutation.isPending}
                    >
                        {mutation.isPending ? "Creating..." : "Create Team"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
