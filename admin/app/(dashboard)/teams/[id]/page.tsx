import { TeamDetails } from "@features/teams/components/team-details";

interface PageProps {
    params: {
        id: string;
    };
}

export default function TeamDetailsPage({ params }: PageProps) {
    const teamId = Number(params.id);

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <TeamDetails teamId={teamId} />
        </div>
    );
}
