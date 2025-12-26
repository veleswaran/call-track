"use client";

import { useCallLogs } from "@features/call-logs/hooks/use-call-logs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@shared/components/ui/table";
import { format } from "date-fns";
import { PhoneIncoming, PhoneOutgoing, PhoneMissed } from "lucide-react";
import { CallActions } from "@features/call-logs/components/call-actions";

/**
 * Call Logs page - displays paginated call log list using API hook
 */
export default function CallLogsPage() {
    const { data, isLoading, isError } = useCallLogs({ page: 1, per_page: 20 });

    const callLogs = data?.data ?? [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Call Logs</h1>
                <p className="text-zinc-500 dark:text-zinc-400">
                    View and manage call log entries
                </p>
            </div>

            <div className="rounded-md border border-zinc-200 dark:border-zinc-800">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Phone Number</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : isError ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-red-500">
                                    Failed to load call logs
                                </TableCell>
                            </TableRow>
                        ) : callLogs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No call logs found
                                </TableCell>
                            </TableRow>
                        ) : (
                            callLogs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell>
                                        {log.call_type === "incoming" && (
                                            <PhoneIncoming className="h-4 w-4 text-blue-500" />
                                        )}
                                        {log.call_type === "outgoing" && (
                                            <PhoneOutgoing className="h-4 w-4 text-green-500" />
                                        )}
                                        {log.call_type === "missed" && (
                                            <PhoneMissed className="h-4 w-4 text-red-500" />
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {log.phone_number}
                                    </TableCell>
                                    <TableCell>
                                        {log.duration > 0
                                            ? `${log.duration}s`
                                            : "-"}
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(log.timestamp), "MMM d, h:mm a")}
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${log.classification?.classification === "business"
                                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                                : log.classification?.classification === "personal"
                                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                                    : log.classification?.classification === "ignored"
                                                        ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                                                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                                }`}
                                        >
                                            {log.classification
                                                ? log.classification.classification.charAt(0).toUpperCase() +
                                                log.classification.classification.slice(1)
                                                : "Unclassified"}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <CallActions callLog={log} />
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
