import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@shared/components/ui/table";
import { Badge } from "@shared/components/ui/badge";
import { format } from "date-fns";
import { CallEscalation, EscalationStatus } from "../types/escalation";

interface MissedCallsTableProps {
    data: CallEscalation[];
    isLoading?: boolean;
}

const getStatusBadge = (status: EscalationStatus) => {
    switch (status) {
        case "pending":
            return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">Pending</Badge>;
        case "unattended":
            return <Badge variant="destructive">Unattended</Badge>;
        case "resolved":
            return <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">Resolved</Badge>;
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
};

export function MissedCallsTable({ data, isLoading }: MissedCallsTableProps) {
    return (
        <div className="rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Agent</TableHead>
                        <TableHead>Client Number</TableHead>
                        <TableHead>Call Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>SLA Deadline</TableHead>
                        <TableHead>Follow-up Time</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                Loading escalations...
                            </TableCell>
                        </TableRow>
                    ) : data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                No missed calls found for current filters.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((escalation) => (
                            <TableRow key={escalation.id}>
                                <TableCell className="font-medium">
                                    {escalation.call_log.agent_name || "Unknown Agent"}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{escalation.call_log.phone_number}</span>
                                        {escalation.call_log.phone_contact_name && (
                                            <span className="text-xs text-zinc-500">{escalation.call_log.phone_contact_name}</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {format(new Date(escalation.call_log.timestamp), "MMM d, yyyy HH:mm")}
                                </TableCell>
                                <TableCell>
                                    {getStatusBadge(escalation.status)}
                                </TableCell>
                                <TableCell className={escalation.status === 'unattended' ? 'text-red-600 font-medium' : ''}>
                                    {format(new Date(escalation.response_due_at), "MMM d, HH:mm")}
                                </TableCell>
                                <TableCell>
                                    {escalation.resolved_at ? (
                                        <div className="flex flex-col">
                                            <span className="text-sm">{format(new Date(escalation.resolved_at), "MMM d, HH:mm")}</span>
                                            <span className="text-xs text-zinc-500">via Outgoing Call</span>
                                        </div>
                                    ) : "-"}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
