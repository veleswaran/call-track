"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@shared/components/ui/button";
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
    const { data: teamRes, isLoading, error } = useQuery({
        queryKey: ["team", teamId],
        queryFn: () => teamsApi.getTeam(teamId),
        enabled: !isNaN(teamId) && teamId > 0,
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

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/teams">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{team.name}</h2>
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
