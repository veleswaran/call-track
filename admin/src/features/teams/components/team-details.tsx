"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Calendar, Users, Pencil, Check, X, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@features/auth/hooks/use-auth";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@shared/components/ui/card";
import { teamsApi } from "../api/teams-api";
import { TeamMembersList } from "./team-members-list";

interface TeamDetailsProps {
    teamId: number;
}

export function TeamDetails({ teamId }: TeamDetailsProps) {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const isAdmin = user?.roles.some((role: string) =>
        ["admin", "super-admin"].includes(role)
    );
    const isSuperAdmin = user?.roles.includes("super-admin");
    const router = useRouter();

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");

    const {
        data: teamRes,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["team", teamId],
        queryFn: () => teamsApi.getTeam(teamId),
        enabled: !isNaN(teamId) && teamId > 0,
    });

    const updateMutation = useMutation({
        mutationFn: (name: string) => teamsApi.updateTeam(teamId, { name }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["team", teamId] });
            queryClient.invalidateQueries({ queryKey: ["teams"] });
            setIsEditing(false);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () => teamsApi.deleteTeam(teamId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teams"] });
            router.push("/teams");
        },
    });

    if (isNaN(teamId) || teamId <= 0) {
        return <div className="text-red-500">Invalid team ID</div>;
    }

    if (isLoading) {
        return <div>Loading team details...</div>;
    }

    if (error || !teamRes) {
        return <div>Error loading team.</div>;
    }

    const team = teamRes.data;

    function handleStartEdit() {
        setEditName(team.name);
        setIsEditing(true);
    }

    function handleSave() {
        const trimmed = editName.trim();
        if (!trimmed || trimmed === team.name) {
            setIsEditing(false);
            return;
        }
        updateMutation.mutate(trimmed);
    }

    function handleCancel() {
        setIsEditing(false);
        setEditName("");
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/teams">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSave();
                                    if (e.key === "Escape") handleCancel();
                                }}
                                className="text-2xl font-bold h-10 max-w-sm"
                                autoFocus
                                disabled={updateMutation.isPending}
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleSave}
                                disabled={
                                    updateMutation.isPending ||
                                    !editName.trim()
                                }
                                title="Save"
                            >
                                <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleCancel}
                                disabled={updateMutation.isPending}
                                title="Cancel"
                            >
                                <X className="h-4 w-4 text-red-500" />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold tracking-tight">
                                {team.name}
                            </h2>
                            {isAdmin && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleStartEdit}
                                    title="Edit team name"
                                    className="h-7 w-7"
                                >
                                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                            )}
                            {isSuperAdmin && !isEditing && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        if (confirm(`Are you sure you want to delete team "${team.name}"?`)) {
                                            deleteMutation.mutate();
                                        }
                                    }}
                                    title="Delete team"
                                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    disabled={deleteMutation.isPending}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            )}
                        </div>
                    )}
                    {updateMutation.isError && (
                        <p className="mt-1 text-sm text-red-500">
                            Failed to update team name. Please try again.
                        </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                        Manage members and settings for this team.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{team.members_count || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Managers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{team.managers_count || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Created On</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Date(team.created_at).toLocaleDateString()}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Team Members</h3>
                <TeamMembersList teamId={team.id} />
            </div>
        </div>
    );
}
